using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Courses;

namespace lms.Application.Interfaces.Services;

public interface ICourseAssignmentService
{
    Task<ApiResponse<object>> AssignCourseAsync(int courseId, AssignCourseRequest request, int? adminId);
    Task<ApiResponse<object>> RemoveAssignmentAsync(int assignmentId, int? adminId);
}
