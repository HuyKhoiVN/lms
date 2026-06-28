using System;

namespace lms.Application.DTOs.Certificates;

public sealed class CertificateFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int? UserId { get; set; }
    public int? ExamId { get; set; }
}

public sealed class GenerateCertificateRequest
{
    public int ResultId { get; set; }
}

public sealed class CertificateListItemResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public int ExamId { get; set; }
    public string? ExamName { get; set; }
    public string CertificateCode { get; set; } = string.Empty;
    public DateTime IssuedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
}

public sealed class CertificateDetailResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public int ExamId { get; set; }
    public string? ExamName { get; set; }
    public string CertificateCode { get; set; } = string.Empty;
    public DateTime IssuedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public CertificateFileResponse? File { get; set; }
}

public sealed class CertificateFileResponse
{
    public int Id { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string StoragePath { get; set; } = string.Empty;
}
