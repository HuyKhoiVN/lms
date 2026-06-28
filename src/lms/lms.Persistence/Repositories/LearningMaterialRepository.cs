using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class LearningMaterialRepository : ILearningMaterialRepository
{
    private readonly LmsDbContext _context;

    public LearningMaterialRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task<LearningMaterial?> GetByIdAsync(int id)
    {
        return await _context.LearningMaterials
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete);
    }

    public async Task<List<LearningMaterial>> GetByCourseIdAsync(int courseId)
    {
        return await _context.LearningMaterials
            .AsNoTracking()
            .Where(x => x.CourseId == courseId && !x.IsDelete)
            .OrderBy(x => x.Order)
            .ToListAsync();
    }

    public async Task<List<LearningMaterial>> GetPagedAsync(
        int? courseId, string? keyword, string? contentType, int page, int pageSize)
    {
        var q = _context.LearningMaterials.AsNoTracking()
            .Where(x => !x.IsDelete);

        if (courseId.HasValue)
            q = q.Where(x => x.CourseId == courseId.Value);

        if (!string.IsNullOrWhiteSpace(keyword))
            q = q.Where(x => x.Title.Contains(keyword));

        if (!string.IsNullOrWhiteSpace(contentType))
            q = q.Where(x => x.ContentType == contentType);

        return await q
            .OrderBy(x => x.CourseId)
            .ThenBy(x => x.Order)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetCountAsync(int? courseId, string? keyword, string? contentType)
    {
        var q = _context.LearningMaterials.AsNoTracking()
            .Where(x => !x.IsDelete);

        if (courseId.HasValue)
            q = q.Where(x => x.CourseId == courseId.Value);

        if (!string.IsNullOrWhiteSpace(keyword))
            q = q.Where(x => x.Title.Contains(keyword));

        if (!string.IsNullOrWhiteSpace(contentType))
            q = q.Where(x => x.ContentType == contentType);

        return await q.CountAsync();
    }

    public async Task AddAsync(LearningMaterial material)
    {
        await _context.LearningMaterials.AddAsync(material);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(LearningMaterial material)
    {
        _context.LearningMaterials.Update(material);
        await _context.SaveChangesAsync();
    }
}
