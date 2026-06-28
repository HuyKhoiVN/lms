using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.LearningProgress;

namespace lms.Application.Interfaces.Services;

/// <summary>
/// Cập nhật và truy vấn tiến độ học tập.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 6 Learning Progress.
/// </summary>
public interface ILearningProgressService
{
    /// <summary>Học viên tự cập nhật tiến độ học của mình.</summary>
    Task<ApiResponse<LearningProgressResponse>> UpdateProgressAsync(int userId, UpdateLearningProgressRequest request);

    /// <summary>Lấy danh sách tiến độ học của học viên hiện tại.</summary>
    Task<ApiResponse<PagedResult<LearningProgressResponse>>> GetMyProgressAsync(int userId, LearningProgressFilterRequest filter);

    /// <summary>Tổng hợp tiến độ theo course (admin + assigned student).</summary>
    Task<ApiResponse<CourseProgressSummaryResponse>> GetCourseProgressSummaryAsync(int courseId, int? requestingUserId, bool isAdmin);
}
