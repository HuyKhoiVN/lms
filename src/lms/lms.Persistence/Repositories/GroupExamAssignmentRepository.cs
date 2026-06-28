using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class GroupExamAssignmentRepository : IGroupExamAssignmentRepository
{
    private readonly LmsDbContext _ctx;
    public GroupExamAssignmentRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<GroupExamAssignment?> GetByIdAsync(int id) =>
        _ctx.GroupExamAssignments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);

    public Task<GroupExamAssignment?> GetByExamAndGroupAsync(int examId, int groupId) =>
        _ctx.GroupExamAssignments.AsNoTracking()
            .FirstOrDefaultAsync(x => x.ExamId == examId && x.GroupId == groupId);

    public Task<List<GroupExamAssignment>> GetByExamIdAsync(int examId) =>
        _ctx.GroupExamAssignments.AsNoTracking().Where(x => x.ExamId == examId).ToListAsync();

    public Task<List<int>> GetExamIdsByGroupIdsAsync(List<int> groupIds) =>
        _ctx.GroupExamAssignments.AsNoTracking()
            .Where(x => groupIds.Contains(x.GroupId)).Select(x => x.ExamId).ToListAsync();

    public async Task AddAsync(GroupExamAssignment a) { await _ctx.GroupExamAssignments.AddAsync(a); await _ctx.SaveChangesAsync(); }
    public async Task RemoveAsync(GroupExamAssignment a) { _ctx.GroupExamAssignments.Remove(a); await _ctx.SaveChangesAsync(); }
}
