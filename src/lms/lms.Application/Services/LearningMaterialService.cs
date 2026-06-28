using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.LearningMaterials;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

/// <summary>
/// Business rules theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 5:
/// - Material phải thuộc course tồn tại.
/// - ContentType chỉ chấp nhận Text / Pdf / File / Link.
/// - Text material phải có TextContent.
/// - Link material phải có ExternalLink.
/// - Student chỉ xem material của course được assign.
/// - Soft delete không xóa history learning progress.
/// </summary>
public sealed class LearningMaterialService : ILearningMaterialService
{
    private readonly ILearningMaterialRepository _materialRepo;
    private readonly ILearningMaterialFileRepository _fileRepo;
    private readonly ICourseRepository _courseRepo;
    private readonly IMaterialAccessService _accessService;
    private readonly IAuditLogService _auditLog;

    public LearningMaterialService(
        ILearningMaterialRepository materialRepo,
        ILearningMaterialFileRepository fileRepo,
        ICourseRepository courseRepo,
        IMaterialAccessService accessService,
        IAuditLogService auditLog)
    {
        _materialRepo = materialRepo;
        _fileRepo = fileRepo;
        _courseRepo = courseRepo;
        _accessService = accessService;
        _auditLog = auditLog;
    }

    public async Task<ApiResponse<LearningMaterialDetailResponse>> GetByIdAsync(int id)
    {
        var m = await _materialRepo.GetByIdAsync(id);
        if (m is null)
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult("Không tìm thấy học liệu.");

        return ApiResponse<LearningMaterialDetailResponse>.SuccessResult(await BuildDetailAsync(m));
    }

    public async Task<ApiResponse<PagedResult<LearningMaterialListItemResponse>>> GetPagedAsync(
        LearningMaterialFilterRequest filter, int? studentUserId)
    {
        // Student chỉ xem material thuộc course được assign
        // Filter phía DB; đơn giản nhất: nếu là student, bắt buộc có courseId filter rồi check access
        int page = filter.Page < 1 ? 1 : filter.Page;
        int pageSize = filter.PageSize is < 1 or > 100 ? 20 : filter.PageSize;

        var materials = await _materialRepo.GetPagedAsync(
            filter.CourseId, filter.Keyword, filter.ContentType, page, pageSize);
        var total = await _materialRepo.GetCountAsync(
            filter.CourseId, filter.Keyword, filter.ContentType);

        // Student access gate: nếu là student mà không pass access → trả danh sách rỗng
        if (studentUserId.HasValue)
        {
            var accessible = new List<LearningMaterial>();
            foreach (var m in materials)
            {
                if (await _accessService.HasAccessAsync(studentUserId.Value, m.Id))
                    accessible.Add(m);
            }
            materials = accessible;
        }

        var items = materials.Select(m => new LearningMaterialListItemResponse
        {
            Id = m.Id,
            CourseId = m.CourseId,
            Title = m.Title,
            ContentType = m.ContentType,
            Order = m.Order,
            HasFile = false // will be enriched lazily in GetById; avoid N+1 in list
        }).ToList();

        return ApiResponse<PagedResult<LearningMaterialListItemResponse>>.SuccessResult(
            new PagedResult<LearningMaterialListItemResponse>(items, total, page, pageSize));
    }

    public async Task<ApiResponse<LearningMaterialDetailResponse>> CreateAsync(
        CreateLearningMaterialRequest request, int? adminId)
    {
        // Validate ContentType
        if (!MaterialContentType.All.Contains(request.ContentType))
        {
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult(
                $"ContentType không hợp lệ. Chấp nhận: {string.Join(", ", MaterialContentType.All)}.");
        }

        // Validate theo ContentType
        if (request.ContentType == MaterialContentType.Text && string.IsNullOrWhiteSpace(request.TextContent))
        {
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult(
                "TextContent không được trống cho học liệu loại Text.");
        }

        if (request.ContentType == MaterialContentType.Link && string.IsNullOrWhiteSpace(request.ExternalLink))
        {
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult(
                "ExternalLink không được trống cho học liệu loại Link.");
        }

        // Validate Course tồn tại (service-level data validation, không dùng FK)
        var course = await _courseRepo.GetByIdAsync(request.CourseId);
        if (course is null)
        {
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult("Không tìm thấy khóa học.");
        }

        var material = new LearningMaterial
        {
            CourseId = request.CourseId,
            Title = request.Title,
            ContentType = request.ContentType,
            TextContent = request.TextContent,
            ExternalLink = request.ExternalLink,
            Order = request.Order,
            IsDelete = false,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = adminId
        };

        await _materialRepo.AddAsync(material);

        await _auditLog.LogActionAsync(
            adminId, "CREATE", "LearningMaterial", material.Id,
            null, $"{{\"CourseId\":{material.CourseId},\"Title\":\"{material.Title}\",\"ContentType\":\"{material.ContentType}\"}}");

        return ApiResponse<LearningMaterialDetailResponse>.SuccessResult(
            await BuildDetailAsync(material), "Tạo học liệu thành công.");
    }

    public async Task<ApiResponse<LearningMaterialDetailResponse>> UpdateAsync(
        int id, UpdateLearningMaterialRequest request, int? adminId)
    {
        var material = await _materialRepo.GetByIdAsync(id);
        if (material is null)
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult("Không tìm thấy học liệu.");

        // Validate content rule (không thay đổi ContentType khi update)
        if (material.ContentType == MaterialContentType.Text && string.IsNullOrWhiteSpace(request.TextContent))
        {
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult(
                "TextContent không được trống cho học liệu loại Text.");
        }

        if (material.ContentType == MaterialContentType.Link && string.IsNullOrWhiteSpace(request.ExternalLink))
        {
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult(
                "ExternalLink không được trống cho học liệu loại Link.");
        }

        var before = $"{{\"Title\":\"{material.Title}\",\"Order\":{material.Order}}}";

        material.Title = request.Title;
        material.TextContent = request.TextContent;
        material.ExternalLink = request.ExternalLink;
        material.Order = request.Order;
        material.UpdateDate = DateTime.UtcNow;
        material.UpdatedBy = adminId;

        await _materialRepo.UpdateAsync(material);

        await _auditLog.LogActionAsync(
            adminId, "UPDATE", "LearningMaterial", material.Id,
            before, $"{{\"Title\":\"{material.Title}\",\"Order\":{material.Order}}}");

        return ApiResponse<LearningMaterialDetailResponse>.SuccessResult(
            await BuildDetailAsync(material), "Cập nhật học liệu thành công.");
    }

    public async Task<ApiResponse<object>> DeleteAsync(int id, int? adminId)
    {
        var material = await _materialRepo.GetByIdAsync(id);
        if (material is null)
            return ApiResponse<object>.FailureResult("Không tìm thấy học liệu.");

        material.IsDelete = true;
        material.UpdateDate = DateTime.UtcNow;
        material.UpdatedBy = adminId;

        await _materialRepo.UpdateAsync(material);

        await _auditLog.LogActionAsync(
            adminId, "DELETE", "LearningMaterial", material.Id,
            $"{{\"Title\":\"{material.Title}\",\"CourseId\":{material.CourseId}}}", null);

        return ApiResponse<object>.SuccessResult(null!, "Xóa học liệu thành công.");
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    private async Task<LearningMaterialDetailResponse> BuildDetailAsync(LearningMaterial m)
    {
        var files = await _fileRepo.GetByMaterialIdAsync(m.Id);

        return new LearningMaterialDetailResponse
        {
            Id = m.Id,
            CourseId = m.CourseId,
            Title = m.Title,
            ContentType = m.ContentType,
            TextContent = m.TextContent,
            ExternalLink = m.ExternalLink,
            Order = m.Order,
            CreatedDate = m.CreatedDate,
            Files = files.Select(f => new MaterialFileResponse
            {
                Id = f.Id,
                LearningMaterialId = f.LearningMaterialId,
                OriginalFileName = f.OriginalFileName,
                FileSize = f.FileSize,
                ContentType = f.ContentType
            }).ToList()
        };
    }
}
