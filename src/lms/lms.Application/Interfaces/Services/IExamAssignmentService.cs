using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Exams;

namespace lms.Application.Interfaces.Services;

/// <summary>
/// Gán / gỡ bài thi cho user, group, course.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 9.
/// </summary>
public interface IExamAssignmentService
{
    Task<ApiResponse<object>> AssignExamAsync(int examId, AssignExamRequest request, int? adminId);
    Task<ApiResponse<object>> RemoveUserAssignmentAsync(int assignmentId, int? adminId);
    Task<ApiResponse<object>> RemoveGroupAssignmentAsync(int assignmentId, int? adminId);
    Task<ApiResponse<PagedResult<ExamAssignmentResponse>>> GetAssignmentsAsync(ExamAssignmentFilterRequest filter);
    Task<ApiResponse<CourseExamResponse>> AddCourseExamAsync(int courseId, AddCourseExamRequest request, int? adminId);
    Task<ApiResponse<object>> RemoveCourseExamAsync(int courseId, int examId, int? adminId);
}
