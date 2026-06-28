using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IGroupExamAssignmentRepository
{
    Task<GroupExamAssignment?> GetByIdAsync(int id);
    Task<GroupExamAssignment?> GetByExamAndGroupAsync(int examId, int groupId);
    Task<List<GroupExamAssignment>> GetByExamIdAsync(int examId);
    Task<List<int>> GetExamIdsByGroupIdsAsync(List<int> groupIds);
    Task AddAsync(GroupExamAssignment assignment);
    Task RemoveAsync(GroupExamAssignment assignment);
}
