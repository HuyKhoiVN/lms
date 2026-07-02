using System;
using System.Collections.Generic;

namespace lms.Application.DTOs.Exams;

// ─── Constants ─────────────────────────────────────────────────────────────────

/// <summary>ReviewMode theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 8.</summary>
public static class ExamReviewMode
{
    public const string NoReview     = "NoReview";
    public const string ResultOnly   = "ResultOnly";
    public const string AnswerOnly   = "AnswerOnly";
    public const string FullReview   = "FullReview";
    public static readonly string[] All = { NoReview, ResultOnly, AnswerOnly, FullReview };
}

// ─── Exam DTOs ─────────────────────────────────────────────────────────────────

public sealed class CreateExamRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public decimal PassScore { get; set; }
    public int? AttemptLimit { get; set; }
    public bool RandomQuestion { get; set; }
    public bool RandomAnswer { get; set; }

    /// <summary>NoReview | ResultOnly | AnswerOnly | FullReview</summary>
    public string? ReviewMode { get; set; } = ExamReviewMode.ResultOnly;
}

public sealed class UpdateExamRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public decimal PassScore { get; set; }
    public int? AttemptLimit { get; set; }
    public bool RandomQuestion { get; set; }
    public bool RandomAnswer { get; set; }
    public string? ReviewMode { get; set; }
}

public sealed class ExamFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Keyword { get; set; }
    public bool? IsPublished { get; set; }
}

public sealed class ExamListItemResponse
{
    public int Id { get; set; }
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public decimal PassScore { get; set; }
    public int? AttemptLimit { get; set; }
    public bool IsPublished { get; set; }
    public string? ReviewMode { get; set; }
    public int QuestionCount { get; set; }
}

public sealed class ExamDetailResponse
{
    public int Id { get; set; }
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public decimal PassScore { get; set; }
    public int? AttemptLimit { get; set; }
    public bool RandomQuestion { get; set; }
    public bool RandomAnswer { get; set; }
    public string? ReviewMode { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? CreatedDate { get; set; }
    public List<ExamQuestionResponse> Questions { get; set; } = new();
    public List<ExamRandomRuleResponse> RandomRules { get; set; } = new();
}

// ─── ExamQuestion DTOs ─────────────────────────────────────────────────────────

public sealed class AddExamQuestionRequest
{
    public int QuestionId { get; set; }

    /// <summary>Optional — override score from Question.Score.</summary>
    public decimal? ScoreOverride { get; set; }
    public int Order { get; set; }
}

public sealed class ExamQuestionResponse
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string? QuestionContent { get; set; }
    public string? QuestionType { get; set; }
    public string? Difficulty { get; set; }
    public decimal Score { get; set; }
    public int Order { get; set; }
}

// ─── RandomRule DTOs ───────────────────────────────────────────────────────────

public sealed class ExamRandomRuleRequest
{
    public int? CategoryId { get; set; }
    public string? Difficulty { get; set; }
    public int QuestionCount { get; set; }
    public decimal ScorePerQuestion { get; set; }
}

public sealed class SaveExamRandomRulesRequest
{
    public List<ExamRandomRuleRequest> Rules { get; set; } = new();
}

public sealed class ExamRandomRuleResponse
{
    public int Id { get; set; }
    public int? CategoryId { get; set; }
    public string? Difficulty { get; set; }
    public int QuestionCount { get; set; }
    public decimal ScorePerQuestion { get; set; }
}

// ─── Assignment DTOs ───────────────────────────────────────────────────────────

public sealed class AssignExamRequest
{
    public List<int>? UserIds { get; set; }
    public List<int>? GroupIds { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public sealed class ExamAssignmentResponse
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public int UserId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public sealed class GroupExamAssignmentResponse
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public int GroupId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public sealed class ExamAssignmentFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int? ExamId { get; set; }
    public int? UserId { get; set; }
}

public sealed class GroupExamAssignmentFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int? ExamId { get; set; }
}

public sealed class AddCourseExamRequest
{
    public int ExamId { get; set; }
    public int Order { get; set; }
}

public sealed class CourseExamResponse
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public int ExamId { get; set; }
    public string? ExamName { get; set; }
    public int Order { get; set; }
}
