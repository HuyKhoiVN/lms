using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public class CourseAssignmentRepository : ICourseAssignmentRepository
{
    private readonly LmsDbContext _context;

    public CourseAssignmentRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task<CourseAssignment?> GetByIdAsync(int id)
    {
        return await _context.CourseAssignments
            .FirstOrDefaultAsync(ca => ca.Id == id);
    }

    public async Task<CourseAssignment?> GetByCourseIdAndUserIdAsync(int courseId, int userId)
    {
        return await _context.CourseAssignments
            .FirstOrDefaultAsync(ca => ca.CourseId == courseId && ca.UserId == userId);
    }

    public async Task AddAsync(CourseAssignment assignment)
    {
        await _context.CourseAssignments.AddAsync(assignment);
        await _context.SaveChangesAsync();
    }

    public async Task RemoveAsync(CourseAssignment assignment)
    {
        _context.CourseAssignments.Remove(assignment);
        await _context.SaveChangesAsync();
    }

    public async Task<List<CourseAssignment>> GetByCourseIdAsync(int courseId)
    {
        return await _context.CourseAssignments
            .AsNoTracking()
            .Where(ca => ca.CourseId == courseId)
            .ToListAsync();
    }
}
