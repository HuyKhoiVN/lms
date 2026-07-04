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

    public Task<List<ExamResult>> GetByUserIdAsync(
        int userId,
        int? examId,
        string? keyword,
        bool? passed,
        int page,
        int pageSize)
    {
        var q = BuildQuery(userId, examId, keyword, passed);
        return q.OrderByDescending(x => x.CompletedDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
    }

    public Task<int> GetCountByUserIdAsync(int userId, int? examId, string? keyword, bool? passed)
    {
        var q = BuildQuery(userId, examId, keyword, passed);
        return q.CountAsync();
    }

    public Task<List<ExamResult>> GetPagedAsync(
        int? examId,
        int? userId,
        string? keyword,
        bool? passed,
        int page,
        int pageSize)
    {
        var q = BuildQuery(userId, examId, keyword, passed);
        return q.OrderByDescending(x => x.CompletedDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
    }

    public Task<int> GetCountAsync(int? examId, int? userId, string? keyword, bool? passed)
    {
        var q = BuildQuery(userId, examId, keyword, passed);
        return q.CountAsync();
    }

    private IQueryable<ExamResult> BuildQuery(int? userId, int? examId, string? keyword, bool? passed)
    {
        var q = _ctx.ExamResults.AsNoTracking().AsQueryable();

        if (userId.HasValue) q = q.Where(x => x.UserId == userId.Value);
        if (examId.HasValue) q = q.Where(x => x.ExamId == examId.Value);
        if (passed.HasValue) q = q.Where(x => x.Passed == passed.Value);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var term = keyword.Trim();
            q =
                from result in q
                join exam in _ctx.Exams.AsNoTracking() on result.ExamId equals exam.Id
                where EF.Functions.Like(exam.Name, $"%{term}%")
                select result;
        }

        return q;
    }

    public async Task AddAsync(ExamResult result)
    { await _ctx.ExamResults.AddAsync(result); await _ctx.SaveChangesAsync(); }
}
