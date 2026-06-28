using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Results;

namespace lms.Application.Interfaces.Services;

/// <summary>
/// Kết quả thi + review theo ReviewMode.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 12.
/// </summary>
public interface IResultService
{
    Task<ApiResponse<PagedResult<ResultListItemResponse>>> GetMyResultsAsync(int userId, MyResultFilterRequest filter);
    Task<ApiResponse<PagedResult<ResultListItemResponse>>> GetAllResultsAsync(ResultFilterRequest filter);
    Task<ApiResponse<ResultDetailResponse>> GetByIdAsync(int id, int? requestingUserId, bool isAdmin);
    Task<ApiResponse<ResultReviewResponse>> GetReviewAsync(int id, int? requestingUserId, bool isAdmin);

    /// <summary>Generate result from submitted attempt (called internally by submit flow).</summary>
    Task GenerateResultAsync(int attemptId);
}
