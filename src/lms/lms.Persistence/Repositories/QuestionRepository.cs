using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class QuestionRepository : IQuestionRepository
{
    private readonly LmsDbContext _ctx;
    public QuestionRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<Question?> GetByIdAsync(int id) =>
        _ctx.Questions.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete);

    public async Task<List<Question>> GetPagedAsync(
        int? categoryId, string? keyword, string? difficulty, string? questionType,
        int page, int pageSize)
    {
        var q = _ctx.Questions.AsNoTracking().Where(x => !x.IsDelete);
        if (categoryId.HasValue) q = q.Where(x => x.CategoryId == categoryId.Value);
        if (!string.IsNullOrWhiteSpace(keyword)) q = q.Where(x => x.Content.Contains(keyword));
        if (!string.IsNullOrWhiteSpace(difficulty)) q = q.Where(x => x.Difficulty == difficulty);
        if (!string.IsNullOrWhiteSpace(questionType)) q = q.Where(x => x.QuestionType == questionType);
        return await q.OrderBy(x => x.CategoryId).ThenBy(x => x.Order)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
    }

    public Task<int> GetCountAsync(int? categoryId, string? keyword, string? difficulty, string? questionType)
    {
        var q = _ctx.Questions.AsNoTracking().Where(x => !x.IsDelete);
        if (categoryId.HasValue) q = q.Where(x => x.CategoryId == categoryId.Value);
        if (!string.IsNullOrWhiteSpace(keyword)) q = q.Where(x => x.Content.Contains(keyword));
        if (!string.IsNullOrWhiteSpace(difficulty)) q = q.Where(x => x.Difficulty == difficulty);
        if (!string.IsNullOrWhiteSpace(questionType)) q = q.Where(x => x.QuestionType == questionType);
        return q.CountAsync();
    }

    /// <summary>
    /// Random N câu theo category + difficulty cho exam random rule.
    /// Dùng NEWID() của SQL Server qua EF để shuffle.
    /// </summary>
    public async Task<List<Question>> GetRandomAsync(int categoryId, string difficulty, int count)
    {
        return await _ctx.Questions.AsNoTracking()
            .Where(x => !x.IsDelete && x.CategoryId == categoryId && x.Difficulty == difficulty)
            .OrderBy(x => Guid.NewGuid()) // EF translates to NEWID() on SQL Server
            .Take(count)
            .ToListAsync();
    }

    public async Task AddAsync(Question question)
    {
        await _ctx.Questions.AddAsync(question);
        await _ctx.SaveChangesAsync();
    }

    public async Task UpdateAsync(Question question)
    {
        _ctx.Questions.Update(question);
        await _ctx.SaveChangesAsync();
    }
}
