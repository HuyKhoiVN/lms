using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using lms.Application.DTOs.Certificates;
using lms.Application.DTOs.Common;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

public sealed class CertificateService : ICertificateService
{
    private readonly ICertificateRepository _certificateRepo;
    private readonly ICertificateFileRepository _certificateFileRepo;
    private readonly IExamResultRepository _resultRepo;
    private readonly IExamRepository _examRepo;
    private readonly IUserRepository _userRepo;
    private readonly IFileStorageService _fileStorage;
    private readonly IAuditLogService _audit;

    public CertificateService(
        ICertificateRepository certificateRepo,
        ICertificateFileRepository certificateFileRepo,
        IExamResultRepository resultRepo,
        IExamRepository examRepo,
        IUserRepository userRepo,
        IFileStorageService fileStorage,
        IAuditLogService audit)
    {
        _certificateRepo = certificateRepo;
        _certificateFileRepo = certificateFileRepo;
        _resultRepo = resultRepo;
        _examRepo = examRepo;
        _userRepo = userRepo;
        _fileStorage = fileStorage;
        _audit = audit;
    }

    public async Task<ApiResponse<PagedResult<CertificateListItemResponse>>> GetPagedAsync(
        CertificateFilterRequest filter, int? requestingUserId, bool isAdmin)
    {
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize is < 1 or > 100 ? 20 : filter.PageSize;
        var userId = isAdmin ? filter.UserId : requestingUserId;
        if (!isAdmin && !userId.HasValue)
            return ApiResponse<PagedResult<CertificateListItemResponse>>.FailureResult("Chua xac thuc.");

        var certificates = await _certificateRepo.GetPagedAsync(userId, filter.ExamId, page, pageSize);
        var total = await _certificateRepo.GetCountAsync(userId, filter.ExamId);
        var items = new System.Collections.Generic.List<CertificateListItemResponse>(certificates.Count);

        foreach (var certificate in certificates)
        {
            var user = await _userRepo.GetByIdAsync(certificate.UserId);
            var exam = await _examRepo.GetByIdAsync(certificate.ExamId);
            items.Add(new CertificateListItemResponse
            {
                Id = certificate.Id,
                UserId = certificate.UserId,
                UserName = user?.UserName,
                ExamId = certificate.ExamId,
                ExamName = exam?.Name,
                CertificateCode = certificate.CertificateCode,
                IssuedDate = certificate.IssuedDate,
                ExpiryDate = certificate.ExpiryDate
            });
        }

        return ApiResponse<PagedResult<CertificateListItemResponse>>.SuccessResult(
            new PagedResult<CertificateListItemResponse>(items, total, page, pageSize));
    }

    public async Task<ApiResponse<CertificateDetailResponse>> GetByIdAsync(int id, int? requestingUserId, bool isAdmin)
    {
        var certificate = await _certificateRepo.GetByIdAsync(id);
        if (certificate is null)
            return ApiResponse<CertificateDetailResponse>.FailureResult("Khong tim thay chung nhan.");
        if (!CanAccess(certificate, requestingUserId, isAdmin))
            return ApiResponse<CertificateDetailResponse>.FailureResult("Ban khong co quyen xem chung nhan nay.");

        return ApiResponse<CertificateDetailResponse>.SuccessResult(await BuildDetailAsync(certificate));
    }

    public async Task<ApiResponse<CertificateDetailResponse>> GenerateAsync(GenerateCertificateRequest request, int? adminId)
    {
        var result = await _resultRepo.GetByIdAsync(request.ResultId);
        if (result is null)
            return ApiResponse<CertificateDetailResponse>.FailureResult("Khong tim thay ket qua thi.");
        if (!result.Passed)
            return ApiResponse<CertificateDetailResponse>.FailureResult("Chi tao chung nhan cho ket qua da dat.");

        var duplicate = await _certificateRepo.GetByUserAndExamAsync(result.UserId, result.ExamId);
        if (duplicate is not null)
            return ApiResponse<CertificateDetailResponse>.FailureResult("Chung nhan cho user va bai thi nay da ton tai.");

        var issuedDate = DateTime.UtcNow;
        var certificate = new Certificate
        {
            UserId = result.UserId,
            ExamId = result.ExamId,
            CertificateCode = $"CERT-{issuedDate:yyyyMMdd}-{result.UserId}-{result.ExamId}-{Guid.NewGuid():N}"[..32],
            IssuedDate = issuedDate,
            CreatedDate = issuedDate,
            CreatedBy = adminId,
            IsDelete = false
        };

        await _certificateRepo.AddAsync(certificate);

        var detail = await BuildCertificateMarkupAsync(certificate, result.Score);
        var bytes = Encoding.UTF8.GetBytes(detail);
        await using var stream = new MemoryStream(bytes);
        var originalFileName = $"{certificate.CertificateCode}.html";
        var storedName = await _fileStorage.SaveFileAsync(stream, originalFileName);

        await _certificateFileRepo.AddAsync(new CertificateFile
        {
            CertificateId = certificate.Id,
            OriginalFileName = originalFileName,
            StoredFileName = storedName,
            FileSize = bytes.Length,
            StoragePath = storedName
        });

        await _audit.LogActionAsync(adminId, "GENERATE_CERTIFICATE", "Certificate", certificate.Id,
            null, $"{{\"ResultId\":{request.ResultId},\"UserId\":{result.UserId},\"ExamId\":{result.ExamId}}}");

        return ApiResponse<CertificateDetailResponse>.SuccessResult(
            await BuildDetailAsync(certificate), "Tao chung nhan thanh cong.");
    }

    public async Task<ApiResponse<CertificateFileResponse>> GetDownloadFileAsync(int id, int? requestingUserId, bool isAdmin)
    {
        var certificate = await _certificateRepo.GetByIdAsync(id);
        if (certificate is null)
            return ApiResponse<CertificateFileResponse>.FailureResult("Khong tim thay chung nhan.");
        if (!CanAccess(certificate, requestingUserId, isAdmin))
            return ApiResponse<CertificateFileResponse>.FailureResult("Ban khong co quyen tai chung nhan nay.");

        var file = await _certificateFileRepo.GetByCertificateIdAsync(id);
        if (file is null)
            return ApiResponse<CertificateFileResponse>.FailureResult("Khong tim thay file chung nhan.");

        await _audit.LogActionAsync(requestingUserId, "DOWNLOAD_CERTIFICATE", "Certificate", certificate.Id,
            null, $"{{\"UserId\":{certificate.UserId},\"ExamId\":{certificate.ExamId}}}");

        return ApiResponse<CertificateFileResponse>.SuccessResult(ToFileResponse(file));
    }

    private async Task<CertificateDetailResponse> BuildDetailAsync(Certificate certificate)
    {
        var user = await _userRepo.GetByIdAsync(certificate.UserId);
        var exam = await _examRepo.GetByIdAsync(certificate.ExamId);
        var file = await _certificateFileRepo.GetByCertificateIdAsync(certificate.Id);

        return new CertificateDetailResponse
        {
            Id = certificate.Id,
            UserId = certificate.UserId,
            UserName = user?.UserName,
            ExamId = certificate.ExamId,
            ExamName = exam?.Name,
            CertificateCode = certificate.CertificateCode,
            IssuedDate = certificate.IssuedDate,
            ExpiryDate = certificate.ExpiryDate,
            File = file is null ? null : ToFileResponse(file)
        };
    }

    private async Task<string> BuildCertificateMarkupAsync(Certificate certificate, decimal score)
    {
        var user = await _userRepo.GetByIdAsync(certificate.UserId);
        var exam = await _examRepo.GetByIdAsync(certificate.ExamId);
        return $"""
<!doctype html>
<html>
<head><meta charset="utf-8"><title>{certificate.CertificateCode}</title></head>
<body>
<h1>Learning Management System Certificate</h1>
<p>Certificate Code: {certificate.CertificateCode}</p>
<p>Student: {System.Net.WebUtility.HtmlEncode(user?.FullName ?? user?.UserName ?? certificate.UserId.ToString())}</p>
<p>Exam: {System.Net.WebUtility.HtmlEncode(exam?.Name ?? certificate.ExamId.ToString())}</p>
<p>Score: {score}</p>
<p>Issued Date: {certificate.IssuedDate:yyyy-MM-dd HH:mm:ss} UTC</p>
</body>
</html>
""";
    }

    private static bool CanAccess(Certificate certificate, int? requestingUserId, bool isAdmin) =>
        isAdmin || (requestingUserId.HasValue && certificate.UserId == requestingUserId.Value);

    private static CertificateFileResponse ToFileResponse(CertificateFile file) => new()
    {
        Id = file.Id,
        OriginalFileName = file.OriginalFileName,
        StoredFileName = file.StoredFileName,
        FileSize = file.FileSize,
        StoragePath = file.StoragePath
    };
}
