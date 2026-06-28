using System;
using System.Collections.Generic;

namespace lms.Application.DTOs.Results;

// ─── Requests ──────────────────────────────────────────────────────────────────

public sealed class MyResultFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int? ExamId { get; set; }
}

public sealed class ResultFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int? ExamId { get; set; }
    public int? UserId { get; set; }
}

// ─── Responses ─────────────────────────────────────────────────────────────────

public sealed class ResultListItemResponse
{
    public int Id { get; set; }
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string? ExamName { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public decimal Score { get; set; }
    public bool Passed { get; set; }
    public DateTime CompletedDate { get; set; }
}

public sealed class ResultDetailResponse
{
    public int Id { get; set; }
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string? ExamName { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public decimal Score { get; set; }
    public bool Passed { get; set; }
    public DateTime CompletedDate { get; set; }
    public List<QuestionResultResponse> Details { get; set; } = new();
}

public sealed class QuestionResultResponse
{
    public int QuestionId { get; set; }
    public string? QuestionContent { get; set; }
    public bool IsCorrect { get; set; }
    public decimal ScoreEarned { get; set; }
}

/// <summary>
/// Full review response — bao gồm question + selected answers + correct answers.
/// Chỉ expose khi ReviewMode cho phép.
/// </summary>
public sealed class ResultReviewResponse
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public decimal Score { get; set; }
    public bool Passed { get; set; }
    public string? ReviewMode { get; set; }
    public List<QuestionReviewResponse> Questions { get; set; } = new();
}

public sealed class QuestionReviewResponse
{
    public int QuestionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public decimal MaxScore { get; set; }
    public decimal ScoreEarned { get; set; }
    public bool IsCorrect { get; set; }
    public List<AnswerReviewResponse> Options { get; set; } = new();
}

public sealed class AnswerReviewResponse
{
    public int AnswerOptionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public bool WasSelected { get; set; }
}
