using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace lms.Application.DTOs.LearningMaterials;

/// <summary>
/// ContentType hợp lệ theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 5.
/// </summary>
public static class MaterialContentType
{
    public const string Text = "Text";
    public const string Pdf  = "Pdf";
    public const string File = "File";
    public const string Link = "Link";
    public const string Image = "Image";
    public const string Video = "Video";
    public const string Mixed = "Mixed";

    public static readonly string[] All = { Text, Pdf, File, Link, Image, Video, Mixed };
}

public static class MaterialBlockType
{
    public const string Text = "Text";
    public const string Image = "Image";
    public const string Video = "Video";
    public const string Pdf = "Pdf";
    public const string File = "File";
    public const string Link = "Link";

    public static readonly string[] All = { Text, Image, Video, Pdf, File, Link };
    public static readonly string[] FileBacked = { Image, Video, Pdf, File };
}

// ─── Requests ──────────────────────────────────────────────────────────────────

public sealed class CreateLearningMaterialRequest
{
    public int CourseId { get; set; }
    public string Title { get; set; } = string.Empty;

    /// <summary>Text | Pdf | File | Link</summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>Bắt buộc khi ContentType = Text.</summary>
    public string? TextContent { get; set; }

    /// <summary>Bắt buộc khi ContentType = Link.</summary>
    public string? ExternalLink { get; set; }

    public int? DurationMinutes { get; set; }

    public int Order { get; set; }
}

public sealed class UpdateLearningMaterialRequest
{
    public string Title { get; set; } = string.Empty;
    public string? TextContent { get; set; }
    public string? ExternalLink { get; set; }
    public int? DurationMinutes { get; set; }
    public int Order { get; set; }
}

public sealed class LearningMaterialFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int? CourseId { get; set; }
    public string? Keyword { get; set; }
    public string? ContentType { get; set; }
}

// ─── Responses ─────────────────────────────────────────────────────────────────

public sealed class LearningMaterialListItemResponse
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool HasFile { get; set; }
    public string? ExternalLink { get; set; }
    public int? DurationMinutes { get; set; }
    public string? OriginalFileName { get; set; }
    public long? FileSize { get; set; }
    public string? FileContentType { get; set; }
}

public sealed class LearningMaterialDetailResponse
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string? TextContent { get; set; }
    public string? ExternalLink { get; set; }
    public int? DurationMinutes { get; set; }
    public int Order { get; set; }
    public DateTime? CreatedDate { get; set; }
    public List<MaterialFileResponse> Files { get; set; } = new();
    public List<LearningMaterialBlockResponse> Blocks { get; set; } = new();
}

public sealed class MaterialFileResponse
{
    public int Id { get; set; }
    public int LearningMaterialId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? ContentType { get; set; }
}

public sealed class CreateTextMaterialBlockRequest
{
    public string TextContent { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public int? SortOrder { get; set; }
}

public sealed class CreateLinkMaterialBlockRequest
{
    public string Url { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public int? SortOrder { get; set; }
}

public sealed class UploadMaterialBlockFileForm
{
    public string BlockType { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public int? SortOrder { get; set; }
    public IFormFile? File { get; set; }
}

public sealed class UpdateLearningMaterialBlockRequest
{
    public string? TextContent { get; set; }
    public string? Url { get; set; }
    public string? Caption { get; set; }
    public int? SortOrder { get; set; }
}

public sealed class ReorderLearningMaterialBlocksRequest
{
    public List<LearningMaterialBlockOrderRequest> Blocks { get; set; } = new();
}

public sealed class LearningMaterialBlockOrderRequest
{
    public int Id { get; set; }
    public int SortOrder { get; set; }
}

public sealed class LearningMaterialBlockResponse
{
    public int Id { get; set; }
    public int LearningMaterialId { get; set; }
    public string BlockType { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public string? TextContent { get; set; }
    public string? Url { get; set; }
    public string? Caption { get; set; }
    public string? FileKey { get; set; }
    public string? OriginalFileName { get; set; }
    public string? ContentType { get; set; }
    public long? FileSize { get; set; }
    public bool CanStream { get; set; }
    public bool CanDownload { get; set; }
}
