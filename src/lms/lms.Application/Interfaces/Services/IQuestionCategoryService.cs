using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Questions;

namespace lms.Application.Interfaces.Services;

/// <summary>
/// CRUD category cho ngân hàng câu hỏi (Admin only).
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 7.
/// </summary>
public interface IQuestionCategoryService
{
    Task<ApiResponse<PagedResult<QuestionCategoryResponse>>> GetPagedAsync(QuestionCategoryFilterRequest filter);
    Task<ApiResponse<QuestionCategoryResponse>> GetByIdAsync(int id);
    Task<ApiResponse<QuestionCategoryResponse>> CreateAsync(CreateQuestionCategoryRequest request, int? adminId);
    Task<ApiResponse<QuestionCategoryResponse>> UpdateAsync(int id, UpdateQuestionCategoryRequest request, int? adminId);
    Task<ApiResponse<object>> DeleteAsync(int id, int? adminId);
}
