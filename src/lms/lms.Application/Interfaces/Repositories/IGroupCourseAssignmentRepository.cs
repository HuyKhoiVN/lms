using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IGroupCourseAssignmentRepository
{
    Task<GroupCourseAssignment?> GetByGroupIdAndCourseIdAsync(int groupId, int courseId);
    Task AddAsync(GroupCourseAssignment assignment);
    Task RemoveAsync(GroupCourseAssignment assignment);
    Task<List<GroupCourseAssignment>> GetByCourseIdAsync(int courseId);
    Task<List<int>> GetGroupCourseIdsAsync(List<int> groupIds);
}
