using System.Linq;
using System.Threading.Tasks;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;

namespace lms.Application.Services;

/// <summary>
/// Student có quyền thi exam khi:
///   1. Có direct ExamAssignment.
///   2. Thuộc group có GroupExamAssignment.
///   3. CourseExam thuộc course mà student được assign (trực tiếp hoặc qua group).
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 9 Business Rules.
/// </summary>
public sealed class ExamAccessService : IExamAccessService
{
    private readonly IExamAssignmentRepository _direct;
    private readonly IGroupExamAssignmentRepository _groupExam;
    private readonly ICourseExamRepository _courseExam;
    private readonly IGroupUserRepository _groupUser;
    private readonly ICourseAccessService _courseAccess;

    public ExamAccessService(
        IExamAssignmentRepository direct,
        IGroupExamAssignmentRepository groupExam,
        ICourseExamRepository courseExam,
        IGroupUserRepository groupUser,
        ICourseAccessService courseAccess)
    {
        _direct = direct;
        _groupExam = groupExam;
        _courseExam = courseExam;
        _groupUser = groupUser;
        _courseAccess = courseAccess;
    }

    public async Task<bool> HasAccessAsync(int userId, int examId)
    {
        // 1. Direct user assignment
        var direct = await _direct.GetByExamAndUserAsync(examId, userId);
        if (direct != null) return true;

        // 2. Group assignment
        var groupIds = await _groupUser.GetGroupIdsByUserIdAsync(userId);
        if (groupIds.Count > 0)
        {
            var groupExamIds = await _groupExam.GetExamIdsByGroupIdsAsync(groupIds);
            if (groupExamIds.Contains(examId)) return true;
        }

        // 3. Course exam — check each course containing the exam
        var courseIds = await _courseExam.GetCourseIdsByExamIdAsync(examId);
        foreach (var courseId in courseIds)
        {
            if (await _courseAccess.HasAccessAsync(userId, courseId))
                return true;
        }

        return false;
    }
}
