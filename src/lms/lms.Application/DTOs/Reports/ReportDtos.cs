using System;
using System.Collections.Generic;

namespace lms.Application.DTOs.Reports;

public class ReportFilterRequest
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int? CourseId { get; set; }
    public int? ExamId { get; set; }
    public int? UserId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public sealed class ReportExportRequest : ReportFilterRequest
{
    public string ReportType { get; set; } = "exam-summary";
}

public sealed class ExamSummaryReportResponse
{
    public int TotalAttempts { get; set; }
    public int SubmittedAttempts { get; set; }
    public int PassedCount { get; set; }
    public decimal AverageScore { get; set; }
    public List<ExamSummaryReportItem> Items { get; set; } = new();
}

public sealed class ExamSummaryReportItem
{
    public int ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public int AttemptCount { get; set; }
    public int PassedCount { get; set; }
    public decimal AverageScore { get; set; }
}

public sealed class PassRateReportResponse
{
    public int TotalResults { get; set; }
    public int PassedCount { get; set; }
    public decimal PassRatePercent { get; set; }
    public List<PassRateReportItem> Items { get; set; } = new();
}

public sealed class PassRateReportItem
{
    public int ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public int TotalResults { get; set; }
    public int PassedCount { get; set; }
    public decimal PassRatePercent { get; set; }
}

public sealed class QuestionAnalysisReportResponse
{
    public List<QuestionAnalysisReportItem> Items { get; set; } = new();
}

public sealed class QuestionAnalysisReportItem
{
    public int QuestionId { get; set; }
    public string QuestionContent { get; set; } = string.Empty;
    public int AnswerCount { get; set; }
    public int CorrectCount { get; set; }
    public decimal CorrectRatePercent { get; set; }
}

public sealed class LearningSummaryReportResponse
{
    public int TotalProgressRecords { get; set; }
    public int CompletedCount { get; set; }
    public decimal AverageProgressPercent { get; set; }
    public List<LearningSummaryReportItem> Items { get; set; } = new();
}

public sealed class LearningSummaryReportItem
{
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public int UserCount { get; set; }
    public int CompletedCount { get; set; }
    public decimal AverageProgressPercent { get; set; }
}

public sealed class ReportExportResponse
{
    public byte[] Content { get; set; } = Array.Empty<byte>();
    public string ContentType { get; set; } = "text/plain";
    public string FileName { get; set; } = "report.txt";
}
