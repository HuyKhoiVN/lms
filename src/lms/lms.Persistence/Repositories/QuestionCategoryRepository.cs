using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class QuestionCategoryRepository : IQuestionCategoryRepository
{
    private readonly LmsDbContext _ctx;
    public QuestionCategoryRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<QuestionCategory?> GetByIdAsync(int id) =>
        _ctx.QuestionCategories.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete);

    public Task<QuestionCategory?> GetByNameAsync(string name) =>
        _ctx.QuestionCategories.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Name == name && !x.IsDelete);

    public async Task<List<QuestionCategory>> GetPagedAsync(string? keyword, int? parentCategoryId, int page, int pageSize)
    {
        var q = _ctx.QuestionCategories.AsNoTracking().Where(x => !x.IsDelete);
        if (!string.IsNullOrWhiteSpace(keyword))
            q = q.Where(x => x.Name.Contains(keyword));
        if (parentCategoryId.HasValue)
            q = q.Where(x => x.ParentCategoryId == parentCategoryId.Value);
        return await q.OrderBy(x => x.Name)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
    }

    public Task<int> GetCountAsync(string? keyword, int? parentCategoryId)
    {
        var q = _ctx.QuestionCategories.AsNoTracking().Where(x => !x.IsDelete);
        if (!string.IsNullOrWhiteSpace(keyword)) q = q.Where(x => x.Name.Contains(keyword));
        if (parentCategoryId.HasValue) q = q.Where(x => x.ParentCategoryId == parentCategoryId.Value);
        return q.CountAsync();
    }

    public Task<bool> HasQuestionsAsync(int categoryId) =>
        _ctx.Questions.AnyAsync(x => x.CategoryId == categoryId && !x.IsDelete);

    public async Task AddAsync(QuestionCategory category)
    {
        await _ctx.QuestionCategories.AddAsync(category);
        await _ctx.SaveChangesAsync();
    }

    public async Task UpdateAsync(QuestionCategory category)
    {
        _ctx.QuestionCategories.Update(category);
        await _ctx.SaveChangesAsync();
    }
}
