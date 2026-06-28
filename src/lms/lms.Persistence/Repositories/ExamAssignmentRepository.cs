using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class ExamAssignmentRepository : IExamAssignmentRepository
{
    private readonly LmsDbContext _ctx;
    public ExamAssignmentRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<ExamAssignment?> GetByIdAsync(int id) =>
        _ctx.ExamAssignments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);

    public Task<ExamAssignment?> GetByExamAndUserAsync(int examId, int userId) =>
        _ctx.ExamAssignments.AsNoTracking()
            .FirstOrDefaultAsync(x => x.ExamId == examId && x.UserId == userId);

    public Task<List<ExamAssignment>> GetByExamIdAsync(int examId) =>
        _ctx.ExamAssignments.AsNoTracking().Where(x => x.ExamId == examId).ToListAsync();

    public Task<List<ExamAssignment>> GetByUserIdAsync(int userId) =>
        _ctx.ExamAssignments.AsNoTracking().Where(x => x.UserId == userId).ToListAsync();

    public Task<List<int>> GetExamIdsByUserIdAsync(int userId) =>
        _ctx.ExamAssignments.AsNoTracking().Where(x => x.UserId == userId).Select(x => x.ExamId).ToListAsync();

    public async Task AddAsync(ExamAssignment a) { await _ctx.ExamAssignments.AddAsync(a); await _ctx.SaveChangesAsync(); }
    public async Task RemoveAsync(ExamAssignment a) { _ctx.ExamAssignments.Remove(a); await _ctx.SaveChangesAsync(); }
}
