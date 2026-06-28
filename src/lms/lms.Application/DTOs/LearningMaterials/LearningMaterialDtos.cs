using System;
using System.Collections.Generic;

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

    public static readonly string[] All = { Text, Pdf, File, Link };
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

    public int Order { get; set; }
}

public sealed class UpdateLearningMaterialRequest
{
    public string Title { get; set; } = string.Empty;
    public string? TextContent { get; set; }
    public string? ExternalLink { get; set; }
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
}

public sealed class LearningMaterialDetailResponse
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string? TextContent { get; set; }
    public string? ExternalLink { get; set; }
    public int Order { get; set; }
    public DateTime? CreatedDate { get; set; }
    public List<MaterialFileResponse> Files { get; set; } = new();
}

public sealed class MaterialFileResponse
{
    public int Id { get; set; }
    public int LearningMaterialId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? ContentType { get; set; }
}
