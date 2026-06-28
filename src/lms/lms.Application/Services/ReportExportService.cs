using System;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Reports;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;

namespace lms.Application.Services;

public sealed class ReportExportService : IReportExportService
{
    private readonly IReportReadRepository _reports;
    private readonly IAuditLogService _audit;

    public ReportExportService(IReportReadRepository reports, IAuditLogService audit)
    {
        _reports = reports;
        _audit = audit;
    }

    public async Task<ApiResponse<ReportExportResponse>> ExportCsvAsync(ReportExportRequest request, int? adminId)
    {
        var csv = await BuildCsvAsync(request);
        await AuditExportAsync(adminId, request.ReportType, "csv");
        return ApiResponse<ReportExportResponse>.SuccessResult(new ReportExportResponse
        {
            Content = Encoding.UTF8.GetBytes(csv),
            ContentType = "text/csv; charset=utf-8",
            FileName = $"{NormalizeReportType(request.ReportType)}-{DateTime.UtcNow:yyyyMMddHHmmss}.csv"
        });
    }

    public async Task<ApiResponse<ReportExportResponse>> ExportPdfAsync(ReportExportRequest request, int? adminId)
    {
        var body = "LMS Report Export\r\n\r\n" + await BuildCsvAsync(request);
        await AuditExportAsync(adminId, request.ReportType, "pdf");
        return ApiResponse<ReportExportResponse>.SuccessResult(new ReportExportResponse
        {
            Content = BuildSimplePdf(body),
            ContentType = "application/pdf",
            FileName = $"{NormalizeReportType(request.ReportType)}-{DateTime.UtcNow:yyyyMMddHHmmss}.pdf"
        });
    }

    private async Task<string> BuildCsvAsync(ReportExportRequest request)
    {
        return NormalizeReportType(request.ReportType) switch
        {
            "pass-rate" => ToCsv(await _reports.GetPassRateAsync(request)),
            "question-analysis" => ToCsv(await _reports.GetQuestionAnalysisAsync(request)),
            "learning-summary" => ToCsv(await _reports.GetLearningSummaryAsync(request)),
            _ => ToCsv(await _reports.GetExamSummaryAsync(request))
        };
    }

    private static string ToCsv(ExamSummaryReportResponse report)
    {
        var sb = new StringBuilder();
        sb.AppendLine("ExamId,ExamName,AttemptCount,PassedCount,AverageScore");
        foreach (var item in report.Items)
        {
            sb.AppendLine($"{item.ExamId},{Csv(item.ExamName)},{item.AttemptCount},{item.PassedCount},{Num(item.AverageScore)}");
        }
        return sb.ToString();
    }

    private static string ToCsv(PassRateReportResponse report)
    {
        var sb = new StringBuilder();
        sb.AppendLine("ExamId,ExamName,TotalResults,PassedCount,PassRatePercent");
        foreach (var item in report.Items)
        {
            sb.AppendLine($"{item.ExamId},{Csv(item.ExamName)},{item.TotalResults},{item.PassedCount},{Num(item.PassRatePercent)}");
        }
        return sb.ToString();
    }

    private static string ToCsv(QuestionAnalysisReportResponse report)
    {
        var sb = new StringBuilder();
        sb.AppendLine("QuestionId,QuestionContent,AnswerCount,CorrectCount,CorrectRatePercent");
        foreach (var item in report.Items)
        {
            sb.AppendLine($"{item.QuestionId},{Csv(item.QuestionContent)},{item.AnswerCount},{item.CorrectCount},{Num(item.CorrectRatePercent)}");
        }
        return sb.ToString();
    }

    private static string ToCsv(LearningSummaryReportResponse report)
    {
        var sb = new StringBuilder();
        sb.AppendLine("CourseId,CourseName,UserCount,CompletedCount,AverageProgressPercent");
        foreach (var item in report.Items)
        {
            sb.AppendLine($"{item.CourseId},{Csv(item.CourseName)},{item.UserCount},{item.CompletedCount},{Num(item.AverageProgressPercent)}");
        }
        return sb.ToString();
    }

    private Task AuditExportAsync(int? adminId, string reportType, string format) =>
        _audit.LogActionAsync(adminId, "EXPORT_REPORT", "Report", null, null,
            $"{{\"ReportType\":\"{NormalizeReportType(reportType)}\",\"Format\":\"{format}\"}}");

    private static string NormalizeReportType(string? reportType)
    {
        var normalized = (reportType ?? "exam-summary").Trim().ToLowerInvariant();
        var allowed = new[] { "exam-summary", "pass-rate", "question-analysis", "learning-summary" };
        return allowed.Contains(normalized) ? normalized : "exam-summary";
    }

    private static string Csv(string value) => $"\"{value.Replace("\"", "\"\"")}\"";
    private static string Num(decimal value) => value.ToString(CultureInfo.InvariantCulture);

    private static byte[] BuildSimplePdf(string text)
    {
        var lines = text.Replace("\r\n", "\n").Split('\n').Take(45).ToList();
        var content = new StringBuilder();
        content.AppendLine("BT");
        content.AppendLine("/F1 10 Tf");
        content.AppendLine("40 752 Td");
        foreach (var line in lines)
        {
            content.Append('(').Append(EscapePdfText(line.Length > 100 ? line[..100] : line)).AppendLine(") Tj");
            content.AppendLine("0 -14 Td");
        }
        content.AppendLine("ET");

        var contentBytes = Encoding.ASCII.GetBytes(content.ToString());
        var objects = new[]
        {
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
            $"<< /Length {contentBytes.Length} >>\nstream\n{content}endstream",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
        };

        var pdf = new StringBuilder();
        var offsets = new System.Collections.Generic.List<int> { 0 };
        pdf.AppendLine("%PDF-1.4");
        for (var i = 0; i < objects.Length; i++)
        {
            offsets.Add(Encoding.ASCII.GetByteCount(pdf.ToString()));
            pdf.AppendLine($"{i + 1} 0 obj");
            pdf.AppendLine(objects[i]);
            pdf.AppendLine("endobj");
        }

        var xrefOffset = Encoding.ASCII.GetByteCount(pdf.ToString());
        pdf.AppendLine("xref");
        pdf.AppendLine($"0 {objects.Length + 1}");
        pdf.AppendLine("0000000000 65535 f ");
        foreach (var offset in offsets.Skip(1))
        {
            pdf.AppendLine($"{offset:0000000000} 00000 n ");
        }
        pdf.AppendLine("trailer");
        pdf.AppendLine($"<< /Size {objects.Length + 1} /Root 1 0 R >>");
        pdf.AppendLine("startxref");
        pdf.AppendLine(xrefOffset.ToString(CultureInfo.InvariantCulture));
        pdf.AppendLine("%%EOF");
        return Encoding.ASCII.GetBytes(pdf.ToString());
    }

    private static string EscapePdfText(string value) =>
        value.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");
}
