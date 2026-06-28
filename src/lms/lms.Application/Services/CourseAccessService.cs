using System.Linq;
using System.Threading.Tasks;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;

namespace lms.Application.Services;

public class CourseAccessService : ICourseAccessService
{
    private readonly ICourseAssignmentRepository _courseAssignmentRepository;
    private readonly IGroupUserRepository _groupUserRepository;
    private readonly IGroupCourseAssignmentRepository _groupCourseAssignmentRepository;

    public CourseAccessService(
        ICourseAssignmentRepository courseAssignmentRepository,
        IGroupUserRepository groupUserRepository,
        IGroupCourseAssignmentRepository groupCourseAssignmentRepository)
    {
        _courseAssignmentRepository = courseAssignmentRepository;
        _groupUserRepository = groupUserRepository;
        _groupCourseAssignmentRepository = groupCourseAssignmentRepository;
    }

    public async Task<bool> HasAccessAsync(int studentId, int courseId)
    {
        // 1. Check direct assignment
        var directAssignment = await _courseAssignmentRepository.GetByCourseIdAndUserIdAsync(courseId, studentId);
        if (directAssignment != null)
        {
            return true;
        }

        // 2. Check group-based assignment
        var userGroupIds = await _groupUserRepository.GetGroupIdsByUserIdAsync(studentId);
        if (userGroupIds != null && userGroupIds.Any())
        {
            var groupCourseIds = await _groupCourseAssignmentRepository.GetGroupCourseIdsAsync(userGroupIds);
            if (groupCourseIds.Contains(courseId))
            {
                return true;
            }
        }

        return false;
    }
}
