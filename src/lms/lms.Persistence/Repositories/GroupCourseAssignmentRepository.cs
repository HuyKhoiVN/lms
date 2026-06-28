using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public class GroupCourseAssignmentRepository : IGroupCourseAssignmentRepository
{
    private readonly LmsDbContext _context;

    public GroupCourseAssignmentRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task<GroupCourseAssignment?> GetByGroupIdAndCourseIdAsync(int groupId, int courseId)
    {
        return await _context.GroupCourseAssignments
            .FirstOrDefaultAsync(gca => gca.GroupId == groupId && gca.CourseId == courseId);
    }

    public async Task AddAsync(GroupCourseAssignment assignment)
    {
        await _context.GroupCourseAssignments.AddAsync(assignment);
        await _context.SaveChangesAsync();
    }

    public async Task RemoveAsync(GroupCourseAssignment assignment)
    {
        _context.GroupCourseAssignments.Remove(assignment);
        await _context.SaveChangesAsync();
    }

    public async Task<List<GroupCourseAssignment>> GetByCourseIdAsync(int courseId)
    {
        return await _context.GroupCourseAssignments
            .AsNoTracking()
            .Where(gca => gca.CourseId == courseId)
            .ToListAsync();
    }

    public async Task<List<int>> GetGroupCourseIdsAsync(List<int> groupIds)
    {
        return await _context.GroupCourseAssignments
            .AsNoTracking()
            .Where(gca => groupIds.Contains(gca.GroupId))
            .Select(gca => gca.CourseId)
            .ToListAsync();
    }
}
