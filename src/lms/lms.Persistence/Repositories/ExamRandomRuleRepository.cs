using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class ExamRandomRuleRepository : IExamRandomRuleRepository
{
    private readonly LmsDbContext _ctx;
    public ExamRandomRuleRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<List<ExamRandomRule>> GetByExamIdAsync(int examId) =>
        _ctx.ExamRandomRules.AsNoTracking().Where(x => x.ExamId == examId).ToListAsync();

    public async Task RemoveByExamIdAsync(int examId)
    {
        var list = await _ctx.ExamRandomRules.Where(x => x.ExamId == examId).ToListAsync();
        if (list.Count > 0) { _ctx.ExamRandomRules.RemoveRange(list); await _ctx.SaveChangesAsync(); }
    }

    public async Task AddRangeAsync(IEnumerable<ExamRandomRule> rules)
    {
        await _ctx.ExamRandomRules.AddRangeAsync(rules);
        await _ctx.SaveChangesAsync();
    }
}
