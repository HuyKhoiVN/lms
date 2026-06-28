using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class ExamAttemptRepository : IExamAttemptRepository
{
    private readonly LmsDbContext _ctx;
    public ExamAttemptRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<ExamAttempt?> GetByIdAsync(int id) =>
        _ctx.ExamAttempts.FirstOrDefaultAsync(x => x.Id == id);

    public Task<ExamAttempt?> GetActiveByUserAndExamAsync(int userId, int examId) =>
        _ctx.ExamAttempts.FirstOrDefaultAsync(x =>
            x.UserId == userId && x.ExamId == examId && x.Status == "InProgress");

    public Task<int> GetAttemptCountAsync(int userId, int examId) =>
        _ctx.ExamAttempts.CountAsync(x => x.UserId == userId && x.ExamId == examId);

    public Task<List<ExamAttempt>> GetByUserIdAsync(int userId, int page, int pageSize) =>
        _ctx.ExamAttempts.AsNoTracking().Where(x => x.UserId == userId)
            .OrderByDescending(x => x.StartedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

    public Task<int> GetCountByUserIdAsync(int userId) =>
        _ctx.ExamAttempts.CountAsync(x => x.UserId == userId);

    public async Task AddAsync(ExamAttempt a) { await _ctx.ExamAttempts.AddAsync(a); await _ctx.SaveChangesAsync(); }
    public async Task UpdateAsync(ExamAttempt a) { _ctx.ExamAttempts.Update(a); await _ctx.SaveChangesAsync(); }
}
