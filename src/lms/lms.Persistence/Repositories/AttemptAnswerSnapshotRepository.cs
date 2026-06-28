using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class AttemptAnswerSnapshotRepository : IAttemptAnswerSnapshotRepository
{
    private readonly LmsDbContext _ctx;
    public AttemptAnswerSnapshotRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<List<AttemptAnswerSnapshot>> GetByAttemptIdAsync(int attemptId) =>
        _ctx.AttemptAnswerSnapshots.AsNoTracking().Where(x => x.AttemptId == attemptId).ToListAsync();

    public Task<List<AttemptAnswerSnapshot>> GetByAttemptAndQuestionAsync(int attemptId, int questionId) =>
        _ctx.AttemptAnswerSnapshots.AsNoTracking()
            .Where(x => x.AttemptId == attemptId && x.QuestionId == questionId).OrderBy(x => x.Order).ToListAsync();

    public async Task AddRangeAsync(IEnumerable<AttemptAnswerSnapshot> snapshots)
    { await _ctx.AttemptAnswerSnapshots.AddRangeAsync(snapshots); await _ctx.SaveChangesAsync(); }
}
