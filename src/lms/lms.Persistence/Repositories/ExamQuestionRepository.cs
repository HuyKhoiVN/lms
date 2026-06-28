using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class ExamQuestionRepository : IExamQuestionRepository
{
    private readonly LmsDbContext _ctx;
    public ExamQuestionRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<List<ExamQuestion>> GetByExamIdAsync(int examId) =>
        _ctx.ExamQuestions.AsNoTracking()
            .Where(x => x.ExamId == examId).OrderBy(x => x.Order).ToListAsync();

    public Task<ExamQuestion?> GetByExamAndQuestionAsync(int examId, int questionId) =>
        _ctx.ExamQuestions.AsNoTracking()
            .FirstOrDefaultAsync(x => x.ExamId == examId && x.QuestionId == questionId);

    public Task<int> GetCountByExamIdAsync(int examId) =>
        _ctx.ExamQuestions.CountAsync(x => x.ExamId == examId);

    public async Task AddAsync(ExamQuestion eq) { await _ctx.ExamQuestions.AddAsync(eq); await _ctx.SaveChangesAsync(); }
    public async Task UpdateAsync(ExamQuestion eq) { _ctx.ExamQuestions.Update(eq); await _ctx.SaveChangesAsync(); }
    public async Task RemoveAsync(ExamQuestion eq) { _ctx.ExamQuestions.Remove(eq); await _ctx.SaveChangesAsync(); }

    public async Task RemoveByExamIdAsync(int examId)
    {
        var list = await _ctx.ExamQuestions.Where(x => x.ExamId == examId).ToListAsync();
        if (list.Count > 0) { _ctx.ExamQuestions.RemoveRange(list); await _ctx.SaveChangesAsync(); }
    }
}
