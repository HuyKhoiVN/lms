using System.Threading.Tasks;
using lms.Application.DTOs.Reports;

namespace lms.Application.Interfaces.Repositories;

public interface IReportReadRepository
{
    Task<ExamSummaryReportResponse> GetExamSummaryAsync(ReportFilterRequest filter);
    Task<PassRateReportResponse> GetPassRateAsync(ReportFilterRequest filter);
    Task<QuestionAnalysisReportResponse> GetQuestionAnalysisAsync(ReportFilterRequest filter);
    Task<LearningSummaryReportResponse> GetLearningSummaryAsync(ReportFilterRequest filter);
}
