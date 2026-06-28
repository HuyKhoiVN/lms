using System;
using System.Collections.Generic;

namespace lms.Application.DTOs.Questions;

// ─── Constants ─────────────────────────────────────────────────────────────────

/// <summary>
/// Các giá trị hợp lệ theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 7.
/// </summary>
public static class QuestionType
{
    public const string SingleChoice   = "SingleChoice";
    public const string MultipleChoice = "MultipleChoice";
    public static readonly string[] All = { SingleChoice, MultipleChoice };
}

public static class QuestionDifficulty
{
    public const string Easy   = "Easy";
    public const string Medium = "Medium";
    public const string Hard   = "Hard";
    public static readonly string[] All = { Easy, Medium, Hard };
}

// ─── Category DTOs ─────────────────────────────────────────────────────────────

public sealed class CreateQuestionCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentCategoryId { get; set; }
}

public sealed class UpdateQuestionCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentCategoryId { get; set; }
}

public sealed class QuestionCategoryFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Keyword { get; set; }
    public int? ParentCategoryId { get; set; }
}

public sealed class QuestionCategoryResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentCategoryId { get; set; }
    public DateTime? CreatedDate { get; set; }
}

// ─── Answer Option DTOs ────────────────────────────────────────────────────────

/// <summary>
/// Dùng trong Create/Update request. IsCorrect không lộ ra ngoài khi read (trừ Admin).
/// </summary>
public sealed class AnswerOptionRequest
{
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int Order { get; set; }
}

/// <summary>
/// Response cho Admin (có IsCorrect). Student KHÔNG được nhận response này trước khi submit.
/// </summary>
public sealed class AnswerOptionAdminResponse
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int Order { get; set; }
}

// ─── Question DTOs ─────────────────────────────────────────────────────────────

public sealed class CreateQuestionRequest
{
    public int CategoryId { get; set; }
    public string Content { get; set; } = string.Empty;

    /// <summary>SingleChoice | MultipleChoice</summary>
    public string QuestionType { get; set; } = string.Empty;

    /// <summary>Easy | Medium | Hard</summary>
    public string Difficulty { get; set; } = string.Empty;

    public decimal Score { get; set; } = 1m;
    public int Order { get; set; }

    /// <summary>
    /// Danh sách đáp án kèm theo. Business rule:
    /// SingleChoice: đúng 1 IsCorrect=true.
    /// MultipleChoice: ≥ 1 IsCorrect=true.
    /// Tối thiểu 2 options cho mọi choice question.
    /// </summary>
    public List<AnswerOptionRequest> AnswerOptions { get; set; } = new();
}

public sealed class UpdateQuestionRequest
{
    public int CategoryId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public int Order { get; set; }

    /// <summary>
    /// Ghi đè toàn bộ answer options (replace strategy).
    /// Không thể thay đổi QuestionType sau khi tạo.
    /// </summary>
    public List<AnswerOptionRequest> AnswerOptions { get; set; } = new();
}

public sealed class QuestionFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int? CategoryId { get; set; }
    public string? Keyword { get; set; }
    public string? Difficulty { get; set; }
    public string? QuestionType { get; set; }
}

public sealed class QuestionListItemResponse
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string Content { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public int AnswerCount { get; set; }
}

public sealed class QuestionDetailResponse
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string Content { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public int Order { get; set; }
    public DateTime? CreatedDate { get; set; }

    /// <summary>
    /// Chỉ Admin mới nhận response này. IsCorrect không expose cho Student.
    /// </summary>
    public List<AnswerOptionAdminResponse> AnswerOptions { get; set; } = new();
}
