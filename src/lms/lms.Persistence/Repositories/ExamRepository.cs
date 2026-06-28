using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class ExamRepository : IExamRepository
{
    private readonly LmsDbContext _ctx;
    public ExamRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<Exam?> GetByIdAsync(int id) =>
        _ctx.Exams.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete);

    public Task<Exam?> GetByCodeAsync(string code) =>
        _ctx.Exams.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code && !x.IsDelete);

    public async Task<List<Exam>> GetPagedAsync(string? keyword, bool? isPublished, int page, int pageSize)
    {
        var q = _ctx.Exams.AsNoTracking().Where(x => !x.IsDelete);
        if (!string.IsNullOrWhiteSpace(keyword)) q = q.Where(x => x.Name.Contains(keyword));
        if (isPublished.HasValue) q = q.Where(x => x.IsPublished == isPublished.Value);
        return await q.OrderByDescending(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
    }

    public Task<int> GetCountAsync(string? keyword, bool? isPublished)
    {
        var q = _ctx.Exams.AsNoTracking().Where(x => !x.IsDelete);
        if (!string.IsNullOrWhiteSpace(keyword)) q = q.Where(x => x.Name.Contains(keyword));
        if (isPublished.HasValue) q = q.Where(x => x.IsPublished == isPublished.Value);
        return q.CountAsync();
    }

    // Student sees exams assigned directly, via group, or via course
    public async Task<List<Exam>> GetPagedForStudentAsync(int userId, string? keyword, int page, int pageSize)
    {
        // Direct user assignments
        var directIds = await _ctx.ExamAssignments.AsNoTracking()
            .Where(a => a.UserId == userId)
            .Select(a => a.ExamId).ToListAsync();

        // Group assignments (groups the user is in)
        var groupIds = await _ctx.GroupUsers.AsNoTracking()
            .Where(g => g.UserId == userId)
            .Select(g => g.GroupId).ToListAsync();

        var groupExamIds = await _ctx.GroupExamAssignments.AsNoTracking()
            .Where(g => groupIds.Contains(g.GroupId))
            .Select(g => g.ExamId).ToListAsync();

        // Course exam assignments (courses the user is in)
        var courseIds = await _ctx.CourseAssignments.AsNoTracking()
            .Where(c => c.UserId == userId)
            .Select(c => c.CourseId).ToListAsync();

        var groupCourseIds = await _ctx.GroupCourseAssignments.AsNoTracking()
            .Where(gc => groupIds.Contains(gc.GroupId))
            .Select(gc => gc.CourseId).ToListAsync();

        var allCourseIds = courseIds.Union(groupCourseIds).Distinct().ToList();

        var courseExamIds = await _ctx.CourseExams.AsNoTracking()
            .Where(ce => allCourseIds.Contains(ce.CourseId))
            .Select(ce => ce.ExamId).ToListAsync();

        var allExamIds = directIds.Union(groupExamIds).Union(courseExamIds).Distinct().ToList();

        var q = _ctx.Exams.AsNoTracking()
            .Where(x => !x.IsDelete && x.IsPublished && allExamIds.Contains(x.Id));
        if (!string.IsNullOrWhiteSpace(keyword)) q = q.Where(x => x.Name.Contains(keyword));

        return await q.OrderByDescending(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
    }

    public async Task<int> GetCountForStudentAsync(int userId, string? keyword)
    {
        var directIds = await _ctx.ExamAssignments.AsNoTracking()
            .Where(a => a.UserId == userId).Select(a => a.ExamId).ToListAsync();

        var groupIds = await _ctx.GroupUsers.AsNoTracking()
            .Where(g => g.UserId == userId).Select(g => g.GroupId).ToListAsync();

        var groupExamIds = await _ctx.GroupExamAssignments.AsNoTracking()
            .Where(g => groupIds.Contains(g.GroupId)).Select(g => g.ExamId).ToListAsync();

        var courseIds = await _ctx.CourseAssignments.AsNoTracking()
            .Where(c => c.UserId == userId).Select(c => c.CourseId).ToListAsync();

        var groupCourseIds = await _ctx.GroupCourseAssignments.AsNoTracking()
            .Where(gc => groupIds.Contains(gc.GroupId)).Select(gc => gc.CourseId).ToListAsync();

        var allCourseIds = courseIds.Union(groupCourseIds).Distinct().ToList();
        var courseExamIds = await _ctx.CourseExams.AsNoTracking()
            .Where(ce => allCourseIds.Contains(ce.CourseId)).Select(ce => ce.ExamId).ToListAsync();

        var allExamIds = directIds.Union(groupExamIds).Union(courseExamIds).Distinct().ToList();

        var q = _ctx.Exams.AsNoTracking()
            .Where(x => !x.IsDelete && x.IsPublished && allExamIds.Contains(x.Id));
        if (!string.IsNullOrWhiteSpace(keyword)) q = q.Where(x => x.Name.Contains(keyword));
        return await q.CountAsync();
    }

    public async Task AddAsync(Exam exam) { await _ctx.Exams.AddAsync(exam); await _ctx.SaveChangesAsync(); }
    public async Task UpdateAsync(Exam exam) { _ctx.Exams.Update(exam); await _ctx.SaveChangesAsync(); }
}
