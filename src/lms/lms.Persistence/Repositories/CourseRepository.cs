using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public class CourseRepository : ICourseRepository
{
    private readonly LmsDbContext _context;

    public CourseRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task<Course?> GetByIdAsync(int id)
    {
        return await _context.Courses.FirstOrDefaultAsync(c => c.Id == id && !c.IsDelete);
    }

    public async Task<Course?> GetByCodeAsync(string code)
    {
        return await _context.Courses.FirstOrDefaultAsync(c => c.Code == code && !c.IsDelete);
    }

    public async Task<List<Course>> GetPagedAsync(string? keyword, bool? isPublished, int page, int pageSize)
    {
        var query = _context.Courses.AsNoTracking().Where(c => !c.IsDelete);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(c => c.Name.Contains(keyword) || 
                                     (c.Description != null && c.Description.Contains(keyword)) ||
                                     (c.Code != null && c.Code.Contains(keyword)));
        }

        if (isPublished.HasValue)
        {
            query = query.Where(c => c.IsPublished == isPublished.Value);
        }

        return await query
            .OrderByDescending(c => c.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetCountAsync(string? keyword, bool? isPublished)
    {
        var query = _context.Courses.AsNoTracking().Where(c => !c.IsDelete);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(c => c.Name.Contains(keyword) || 
                                     (c.Description != null && c.Description.Contains(keyword)) ||
                                     (c.Code != null && c.Code.Contains(keyword)));
        }

        if (isPublished.HasValue)
        {
            query = query.Where(c => c.IsPublished == isPublished.Value);
        }

        return await query.CountAsync();
    }

    public async Task AddAsync(Course course)
    {
        await _context.Courses.AddAsync(course);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Course course)
    {
        _context.Courses.Update(course);
        await _context.SaveChangesAsync();
    }

    public async Task<List<Course>> GetPagedAssignedToUserAsync(int userId, string? keyword, int page, int pageSize)
    {
        var groupIds = await _context.GroupUsers
            .AsNoTracking()
            .Where(gu => gu.UserId == userId)
            .Select(gu => gu.GroupId)
            .ToListAsync();

        var courseIdsQuery = _context.CourseAssignments
            .AsNoTracking()
            .Where(ca => ca.UserId == userId)
            .Select(ca => ca.CourseId)
            .Union(
                _context.GroupCourseAssignments
                    .AsNoTracking()
                    .Where(gca => groupIds.Contains(gca.GroupId))
                    .Select(gca => gca.CourseId)
            );

        var query = from c in _context.Courses.AsNoTracking()
                    join cid in courseIdsQuery on c.Id equals cid
                    where !c.IsDelete && c.IsPublished
                    select c;

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(c => c.Name.Contains(keyword) || 
                                     (c.Description != null && c.Description.Contains(keyword)) ||
                                     (c.Code != null && c.Code.Contains(keyword)));
        }

        return await query
            .OrderByDescending(c => c.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetCountAssignedToUserAsync(int userId, string? keyword)
    {
        var groupIds = await _context.GroupUsers
            .AsNoTracking()
            .Where(gu => gu.UserId == userId)
            .Select(gu => gu.GroupId)
            .ToListAsync();

        var courseIdsQuery = _context.CourseAssignments
            .AsNoTracking()
            .Where(ca => ca.UserId == userId)
            .Select(ca => ca.CourseId)
            .Union(
                _context.GroupCourseAssignments
                    .AsNoTracking()
                    .Where(gca => groupIds.Contains(gca.GroupId))
                    .Select(gca => gca.CourseId)
            );

        var query = from c in _context.Courses.AsNoTracking()
                    join cid in courseIdsQuery on c.Id equals cid
                    where !c.IsDelete && c.IsPublished
                    select c;

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(c => c.Name.Contains(keyword) || 
                                     (c.Description != null && c.Description.Contains(keyword)) ||
                                     (c.Code != null && c.Code.Contains(keyword)));
        }

        return await query.CountAsync();
    }
}
