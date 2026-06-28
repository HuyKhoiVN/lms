using System;
using System.Collections.Generic;

namespace lms.Application.DTOs.LearningProgress;

// ─── Requests ──────────────────────────────────────────────────────────────────

public sealed class UpdateLearningProgressRequest
{
    public int CourseId { get; set; }
    public int LearningMaterialId { get; set; }

    /// <summary>0–100. Service clamp về 100 nếu vượt quá.</summary>
    public decimal ProgressPercent { get; set; }
}

public sealed class LearningProgressFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int? CourseId { get; set; }
}

public sealed class CourseProgressFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

// ─── Responses ─────────────────────────────────────────────────────────────────

public sealed class LearningProgressResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CourseId { get; set; }
    public int LearningMaterialId { get; set; }
    public decimal ProgressPercent { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedDate { get; set; }
    public DateTime? LastAccessedDate { get; set; }
}

public sealed class CourseProgressSummaryResponse
{
    public int CourseId { get; set; }
    public int TotalMaterials { get; set; }
    public int CompletedMaterials { get; set; }

    /// <summary>Tỉ lệ hoàn thành 0-100.</summary>
    public decimal OverallPercent { get; set; }
    public List<LearningProgressResponse> Details { get; set; } = new();
}
