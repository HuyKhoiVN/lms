using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.ExamAttempts;

namespace lms.Application.Interfaces.Services;

/// <summary>
/// Exam runtime engine: start, get active attempt, autosave, submit.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 10.
/// </summary>
public interface IExamAttemptService
{
    Task<ApiResponse<StartExamResponse>> StartExamAsync(int userId, StartExamRequest request);
    Task<ApiResponse<ExamAttemptTakingResponse>> GetActiveAttemptAsync(int userId, int attemptId);
    Task<ApiResponse<AutosaveAttemptResponse>> AutosaveAsync(int userId, int attemptId, AutosaveAttemptRequest request);
    Task<ApiResponse<SubmitAttemptResponse>> SubmitAsync(int userId, int attemptId, SubmitAttemptRequest request);
}
