using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class LearningProgressRepository : ILearningProgressRepository
{
    private readonly LmsDbContext _context;

    public LearningProgressRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task<LearningProgress?> GetByUserAndMaterialAsync(int userId, int materialId)
    {
        return await _context.LearningProgress
            .FirstOrDefaultAsync(x => x.UserId == userId && x.LearningMaterialId == materialId);
    }

    public async Task<List<LearningProgress>> GetByUserAsync(int userId, int? courseId, int page, int pageSize)
    {
        var q = _context.LearningProgress.AsNoTracking()
            .Where(x => x.UserId == userId);

        if (courseId.HasValue)
            q = q.Where(x => x.CourseId == courseId.Value);

        return await q
            .OrderByDescending(x => x.UpdateDate ?? x.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetCountByUserAsync(int userId, int? courseId)
    {
        var q = _context.LearningProgress.AsNoTracking()
            .Where(x => x.UserId == userId);

        if (courseId.HasValue)
            q = q.Where(x => x.CourseId == courseId.Value);

        return await q.CountAsync();
    }

    public async Task<List<LearningProgress>> GetByCourseAsync(int courseId)
    {
        return await _context.LearningProgress
            .AsNoTracking()
            .Where(x => x.CourseId == courseId)
            .ToListAsync();
    }

    public async Task AddAsync(LearningProgress progress)
    {
        await _context.LearningProgress.AddAsync(progress);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(LearningProgress progress)
    {
        _context.LearningProgress.Update(progress);
        await _context.SaveChangesAsync();
    }
}
