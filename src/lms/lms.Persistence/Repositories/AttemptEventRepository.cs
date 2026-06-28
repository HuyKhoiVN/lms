using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class AttemptEventRepository : IAttemptEventRepository
{
    private readonly LmsDbContext _ctx;
    public AttemptEventRepository(LmsDbContext ctx) => _ctx = ctx;

    public async Task AddAsync(AttemptEvent evt) { await _ctx.AttemptEvents.AddAsync(evt); await _ctx.SaveChangesAsync(); }

    public Task<List<AttemptEvent>> GetByAttemptIdAsync(int attemptId) =>
        _ctx.AttemptEvents.AsNoTracking().Where(x => x.AttemptId == attemptId)
            .OrderBy(x => x.CreatedDate).ToListAsync();
}
