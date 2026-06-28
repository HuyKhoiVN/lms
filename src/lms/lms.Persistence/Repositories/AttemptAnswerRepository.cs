using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class AttemptAnswerRepository : IAttemptAnswerRepository
{
    private readonly LmsDbContext _ctx;
    public AttemptAnswerRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<List<AttemptAnswer>> GetByAttemptIdAsync(int attemptId) =>
        _ctx.AttemptAnswers.AsNoTracking().Where(x => x.AttemptId == attemptId).ToListAsync();

    public Task<List<AttemptAnswer>> GetByAttemptAndQuestionAsync(int attemptId, int questionId) =>
        _ctx.AttemptAnswers.Where(x => x.AttemptId == attemptId && x.QuestionId == questionId).ToListAsync();

    public async Task RemoveByAttemptAndQuestionAsync(int attemptId, int questionId)
    {
        var list = await _ctx.AttemptAnswers
            .Where(x => x.AttemptId == attemptId && x.QuestionId == questionId).ToListAsync();
        if (list.Count > 0) { _ctx.AttemptAnswers.RemoveRange(list); await _ctx.SaveChangesAsync(); }
    }

    public async Task AddRangeAsync(IEnumerable<AttemptAnswer> answers)
    { await _ctx.AttemptAnswers.AddRangeAsync(answers); await _ctx.SaveChangesAsync(); }
}
