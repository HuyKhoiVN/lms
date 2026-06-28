using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Exams;

namespace lms.Application.Interfaces.Services;

/// <summary>
/// CRUD exam, publish/unpublish, quản lý manual question + random rules.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 8.
/// </summary>
public interface IExamService
{
    Task<ApiResponse<PagedResult<ExamListItemResponse>>> GetPagedAsync(ExamFilterRequest filter, int? studentUserId);
    Task<ApiResponse<ExamDetailResponse>> GetByIdAsync(int id);
    Task<ApiResponse<ExamDetailResponse>> CreateAsync(CreateExamRequest request, int? adminId);
    Task<ApiResponse<ExamDetailResponse>> UpdateAsync(int id, UpdateExamRequest request, int? adminId);
    Task<ApiResponse<object>> DeleteAsync(int id, int? adminId);
    Task<ApiResponse<ExamDetailResponse>> AddQuestionAsync(int examId, AddExamQuestionRequest request, int? adminId);
    Task<ApiResponse<object>> RemoveQuestionAsync(int examId, int questionId, int? adminId);
    Task<ApiResponse<ExamDetailResponse>> SaveRandomRulesAsync(int examId, SaveExamRandomRulesRequest request, int? adminId);
    Task<ApiResponse<object>> PublishAsync(int id, bool publish, int? adminId);
}
