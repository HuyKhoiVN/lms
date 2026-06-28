using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class CourseExamRepository : ICourseExamRepository
{
    private readonly LmsDbContext _ctx;
    public CourseExamRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<List<CourseExam>> GetExamsByCourseIdAsync(int courseId) =>
        _ctx.CourseExams.AsNoTracking()
            .Where(x => x.CourseId == courseId).OrderBy(x => x.Order).ToListAsync();

    public Task<CourseExam?> GetByIdAsync(int id) =>
        _ctx.CourseExams.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);

    public Task<CourseExam?> GetByCourseAndExamAsync(int courseId, int examId) =>
        _ctx.CourseExams.AsNoTracking()
            .FirstOrDefaultAsync(x => x.CourseId == courseId && x.ExamId == examId);

    public Task<List<int>> GetCourseIdsByExamIdAsync(int examId) =>
        _ctx.CourseExams.AsNoTracking().Where(x => x.ExamId == examId).Select(x => x.CourseId).ToListAsync();

    public async Task AddAsync(CourseExam ce) { await _ctx.CourseExams.AddAsync(ce); await _ctx.SaveChangesAsync(); }
    public async Task RemoveAsync(CourseExam ce) { _ctx.CourseExams.Remove(ce); await _ctx.SaveChangesAsync(); }
}
