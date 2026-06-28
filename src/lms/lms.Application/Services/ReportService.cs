using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Reports;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;

namespace lms.Application.Services;

public sealed class ReportService : IReportService
{
    private readonly IReportReadRepository _reports;
    private readonly IAuditLogService _audit;

    public ReportService(IReportReadRepository reports, IAuditLogService audit)
    {
        _reports = reports;
        _audit = audit;
    }

    public async Task<ApiResponse<ExamSummaryReportResponse>> GetExamSummaryAsync(ReportFilterRequest filter, int? adminId)
    {
        await AuditViewAsync(adminId, "exam-summary");
        return ApiResponse<ExamSummaryReportResponse>.SuccessResult(await _reports.GetExamSummaryAsync(filter));
    }

    public async Task<ApiResponse<PassRateReportResponse>> GetPassRateAsync(ReportFilterRequest filter, int? adminId)
    {
        await AuditViewAsync(adminId, "pass-rate");
        return ApiResponse<PassRateReportResponse>.SuccessResult(await _reports.GetPassRateAsync(filter));
    }

    public async Task<ApiResponse<QuestionAnalysisReportResponse>> GetQuestionAnalysisAsync(ReportFilterRequest filter, int? adminId)
    {
        await AuditViewAsync(adminId, "question-analysis");
        return ApiResponse<QuestionAnalysisReportResponse>.SuccessResult(await _reports.GetQuestionAnalysisAsync(filter));
    }

    public async Task<ApiResponse<LearningSummaryReportResponse>> GetLearningSummaryAsync(ReportFilterRequest filter, int? adminId)
    {
        await AuditViewAsync(adminId, "learning-summary");
        return ApiResponse<LearningSummaryReportResponse>.SuccessResult(await _reports.GetLearningSummaryAsync(filter));
    }

    private Task AuditViewAsync(int? adminId, string reportType) =>
        _audit.LogActionAsync(adminId, "VIEW_REPORT", "Report", null, null, $"{{\"ReportType\":\"{reportType}\"}}");
}
