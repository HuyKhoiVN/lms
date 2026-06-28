using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class AnswerOptionRepository : IAnswerOptionRepository
{
    private readonly LmsDbContext _ctx;
    public AnswerOptionRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<List<AnswerOption>> GetByQuestionIdAsync(int questionId) =>
        _ctx.AnswerOptions.AsNoTracking()
            .Where(x => x.QuestionId == questionId && !x.IsDelete)
            .OrderBy(x => x.Order)
            .ToListAsync();

    public Task<AnswerOption?> GetByIdAsync(int id) =>
        _ctx.AnswerOptions.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete);

    public async Task AddRangeAsync(IEnumerable<AnswerOption> options)
    {
        await _ctx.AnswerOptions.AddRangeAsync(options);
        await _ctx.SaveChangesAsync();
    }

    public async Task UpdateAsync(AnswerOption option)
    {
        _ctx.AnswerOptions.Update(option);
        await _ctx.SaveChangesAsync();
    }

    public async Task RemoveRangeAsync(IEnumerable<AnswerOption> options)
    {
        _ctx.AnswerOptions.RemoveRange(options);
        await _ctx.SaveChangesAsync();
    }

    public async Task RemoveByQuestionIdAsync(int questionId)
    {
        var opts = await _ctx.AnswerOptions
            .Where(x => x.QuestionId == questionId)
            .ToListAsync();
        if (opts.Count > 0)
        {
            _ctx.AnswerOptions.RemoveRange(opts);
            await _ctx.SaveChangesAsync();
        }
    }
}
