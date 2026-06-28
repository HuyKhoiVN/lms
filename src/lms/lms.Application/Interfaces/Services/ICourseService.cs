using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Courses;

namespace lms.Application.Interfaces.Services;

public interface ICourseService
{
    Task<ApiResponse<CourseDetailResponse>> CreateCourseAsync(CreateCourseRequest request, int? adminId);
    Task<ApiResponse<CourseDetailResponse>> UpdateCourseAsync(int id, UpdateCourseRequest request, int? adminId);
    Task<ApiResponse<object>> DeleteCourseAsync(int id, int? adminId);
    Task<ApiResponse<CourseDetailResponse>> GetByIdAsync(int id);
    Task<ApiResponse<PagedResult<CourseListItemResponse>>> GetPagedAsync(CourseFilterRequest filter, int? studentId);

    /// <summary>Publish hoặc Unpublish course.</summary>
    Task<ApiResponse<CourseDetailResponse>> PublishCourseAsync(int id, bool published, int? adminId);
}
