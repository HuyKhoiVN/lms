using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public class GroupRepository : IGroupRepository
{
    private readonly LmsDbContext _context;

    public GroupRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task<Group?> GetByIdAsync(int id)
    {
        return await _context.Groups.FirstOrDefaultAsync(g => g.Id == id && !g.IsDelete);
    }

    public async Task<Group?> GetByNameAsync(string name)
    {
        return await _context.Groups.FirstOrDefaultAsync(g => g.Name == name && !g.IsDelete);
    }

    public async Task<List<Group>> GetPagedAsync(string? keyword, int page, int pageSize)
    {
        var query = _context.Groups.AsNoTracking().Where(g => !g.IsDelete);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(g => g.Name.Contains(keyword) || 
                                     (g.Description != null && g.Description.Contains(keyword)));
        }

        return await query
            .OrderByDescending(g => g.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetCountAsync(string? keyword)
    {
        var query = _context.Groups.AsNoTracking().Where(g => !g.IsDelete);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(g => g.Name.Contains(keyword) || 
                                     (g.Description != null && g.Description.Contains(keyword)));
        }

        return await query.CountAsync();
    }

    public async Task AddAsync(Group group)
    {
        await _context.Groups.AddAsync(group);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Group group)
    {
        _context.Groups.Update(group);
        await _context.SaveChangesAsync();
    }
}
