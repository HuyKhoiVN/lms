using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Reports;

namespace lms.Application.Interfaces.Services;

public interface IReportService
{
    Task<ApiResponse<ExamSummaryReportResponse>> GetExamSummaryAsync(ReportFilterRequest filter, int? adminId);
    Task<ApiResponse<PassRateReportResponse>> GetPassRateAsync(ReportFilterRequest filter, int? adminId);
    Task<ApiResponse<QuestionAnalysisReportResponse>> GetQuestionAnalysisAsync(ReportFilterRequest filter, int? adminId);
    Task<ApiResponse<LearningSummaryReportResponse>> GetLearningSummaryAsync(ReportFilterRequest filter, int? adminId);
}
