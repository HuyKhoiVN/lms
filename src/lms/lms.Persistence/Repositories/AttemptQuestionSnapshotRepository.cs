using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class AttemptQuestionSnapshotRepository : IAttemptQuestionSnapshotRepository
{
    private readonly LmsDbContext _ctx;
    public AttemptQuestionSnapshotRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<List<AttemptQuestionSnapshot>> GetByAttemptIdAsync(int attemptId) =>
        _ctx.AttemptQuestionSnapshots.AsNoTracking()
            .Where(x => x.AttemptId == attemptId).OrderBy(x => x.Order).ToListAsync();

    public async Task AddRangeAsync(IEnumerable<AttemptQuestionSnapshot> snapshots)
    { await _ctx.AttemptQuestionSnapshots.AddRangeAsync(snapshots); await _ctx.SaveChangesAsync(); }
}
