using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Questions;

namespace lms.Application.Interfaces.Services;

/// <summary>
/// CRUD câu hỏi + đáp án (Admin only).
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 7.
/// Business rule đặc biệt:
///   - SingleChoice: đúng 1 IsCorrect = true.
///   - MultipleChoice: ≥ 1 IsCorrect = true.
///   - Tối thiểu 2 answer options cho choice question.
///   - Không expose IsCorrect cho Student.
///   - Soft delete câu hỏi đã dùng trong published exam bị chặn nếu có attempt.
/// </summary>
public interface IQuestionService
{
    Task<ApiResponse<PagedResult<QuestionListItemResponse>>> GetPagedAsync(QuestionFilterRequest filter);
    Task<ApiResponse<QuestionDetailResponse>> GetByIdAsync(int id);
    Task<ApiResponse<QuestionDetailResponse>> CreateAsync(CreateQuestionRequest request, int? adminId);
    Task<ApiResponse<QuestionDetailResponse>> UpdateAsync(int id, UpdateQuestionRequest request, int? adminId);
    Task<ApiResponse<object>> DeleteAsync(int id, int? adminId);
}
