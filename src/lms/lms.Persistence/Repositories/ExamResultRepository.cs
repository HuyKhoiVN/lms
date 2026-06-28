using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class ExamResultRepository : IExamResultRepository
{
    private readonly LmsDbContext _ctx;
    public ExamResultRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<ExamResult?> GetByIdAsync(int id) =>
        _ctx.ExamResults.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);

    public Task<ExamResult?> GetByAttemptIdAsync(int attemptId) =>
        _ctx.ExamResults.AsNoTracking().FirstOrDefaultAsync(x => x.AttemptId == attemptId);

    public Task<List<ExamResult>> GetByUserIdAsync(int userId, int? examId, int page, int pageSize)
    {
        var q = _ctx.ExamResults.AsNoTracking().Where(x => x.UserId == userId);
        if (examId.HasValue) q = q.Where(x => x.ExamId == examId.Value);
        return q.OrderByDescending(x => x.CompletedDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
    }

    public Task<int> GetCountByUserIdAsync(int userId, int? examId)
    {
        var q = _ctx.ExamResults.AsNoTracking().Where(x => x.UserId == userId);
        if (examId.HasValue) q = q.Where(x => x.ExamId == examId.Value);
        return q.CountAsync();
    }

    public Task<List<ExamResult>> GetPagedAsync(int? examId, int? userId, int page, int pageSize)
    {
        var q = _ctx.ExamResults.AsNoTracking().AsQueryable();
        if (examId.HasValue) q = q.Where(x => x.ExamId == examId.Value);
        if (userId.HasValue) q = q.Where(x => x.UserId == userId.Value);
        return q.OrderByDescending(x => x.CompletedDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
    }

    public Task<int> GetCountAsync(int? examId, int? userId)
    {
        var q = _ctx.ExamResults.AsNoTracking().AsQueryable();
        if (examId.HasValue) q = q.Where(x => x.ExamId == examId.Value);
        if (userId.HasValue) q = q.Where(x => x.UserId == userId.Value);
        return q.CountAsync();
    }

    public async Task AddAsync(ExamResult result)
    { await _ctx.ExamResults.AddAsync(result); await _ctx.SaveChangesAsync(); }
}
