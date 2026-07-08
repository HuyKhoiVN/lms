using System;
using System.Collections.Generic;

namespace lms.Application.DTOs.ExamAttempts;

// ─── Constants ─────────────────────────────────────────────────────────────────

public static class AttemptStatus
{
    public const string InProgress    = "InProgress";
    public const string Submitted     = "Submitted";
    public const string AutoSubmitted = "AutoSubmitted";
}

// ─── Requests ──────────────────────────────────────────────────────────────────

public sealed class StartExamRequest
{
    public int ExamId { get; set; }
}

public sealed class AutosaveAttemptRequest
{
    /// <summary>Danh sách answer đang chọn; service replace toàn bộ answer cho từng question.</summary>
    public List<QuestionAnswerDto> Answers { get; set; } = new();
}

public sealed class QuestionAnswerDto
{
    public int QuestionId { get; set; }
    /// <summary>Danh sách AnswerOptionId đã chọn (single choice = 1 phần tử, multiple = nhiều).</summary>
    public List<int> SelectedOptionIds { get; set; } = new();
}

public sealed class SubmitAttemptRequest
{
    /// <summary>Final answers. Có thể trống nếu đã autosave trước đó — service lấy từ DB.</summary>
    public List<QuestionAnswerDto>? Answers { get; set; }
    public bool AutoSubmit { get; set; }
}

// ─── Responses ─────────────────────────────────────────────────────────────────

public sealed class StartExamResponse
{
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public decimal PassScore { get; set; }
    public string? ReviewMode { get; set; }
    public string ReviewPolicy { get; set; } = string.Empty;
    public int QuestionCount { get; set; }
    public DateTime StartedAt { get; set; }
    public List<AttemptQuestionResponse> Questions { get; set; } = new();
}

/// <summary>
/// Câu hỏi trong lúc thi — KHÔNG có IsCorrect.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 10:
/// "UI khong duoc nhan IsCorrect truoc khi submit/review hop le".
/// </summary>
public sealed class AttemptQuestionResponse
{
    public int QuestionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string? Difficulty { get; set; }
    public string? Category { get; set; }
    public decimal Score { get; set; }
    public int Order { get; set; }
    public List<AttemptAnswerOptionResponse> Options { get; set; } = new();
}

/// <summary>Option — IsCorrect bị ẩn khỏi student trong lúc thi.</summary>
public sealed class AttemptAnswerOptionResponse
{
    public int AnswerOptionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public int Order { get; set; }
}

public sealed class ExamAttemptTakingResponse
{
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public decimal PassScore { get; set; }
    public string? ReviewMode { get; set; }
    public string ReviewPolicy { get; set; } = string.Empty;
    public int QuestionCount { get; set; }
    public DateTime StartedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<AttemptQuestionResponse> Questions { get; set; } = new();
    /// <summary>Answers đã chọn trước đó (autosave).</summary>
    public List<QuestionAnswerDto> SavedAnswers { get; set; } = new();
}

public sealed class AutosaveAttemptResponse
{
    public int AttemptId { get; set; }
    public int SavedCount { get; set; }
    public DateTime SavedAt { get; set; }
}

public sealed class SubmitAttemptResponse
{
    public int AttemptId { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? Score { get; set; }
    public bool? Passed { get; set; }
    public DateTime? SubmittedAt { get; set; }
}
