using System;
using Microsoft.AspNetCore.Http;

namespace lms.Application.DTOs.Common;

public class FileRecordResponse
{
    public int Id { get; set; }
    public string FileKey { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string StorageProvider { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public DateTime? CreatedDate { get; set; }
}

public class FileFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Keyword { get; set; }
    public string? Purpose { get; set; }
}

/// <summary>
/// Form data cho upload file.
/// Tách ra khỏi controller theo nguyên tắc không đặt DTO inline trong controller.
/// </summary>
public sealed class UploadFileForm
{
    /// <summary>Tệp đính kèm.</summary>
    public IFormFile? File { get; set; }

    /// <summary>Mục đích sử dụng (LearningMaterial, Certificate, Report, General...).</summary>
    public string? Purpose { get; set; }
}
