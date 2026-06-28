using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public class GroupUserRepository : IGroupUserRepository
{
    private readonly LmsDbContext _context;

    public GroupUserRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task<List<User>> GetMembersAsync(int groupId, string? keyword, int page, int pageSize)
    {
        var query = from gu in _context.GroupUsers
                    join u in _context.Users on gu.UserId equals u.Id
                    where gu.GroupId == groupId && !u.IsDelete
                    select u;

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(u => u.UserName.Contains(keyword) || 
                                     (u.FullName != null && u.FullName.Contains(keyword)) ||
                                     (u.Email != null && u.Email.Contains(keyword)));
        }

        return await query
            .OrderBy(u => u.UserName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetMembersCountAsync(int groupId, string? keyword)
    {
        var query = from gu in _context.GroupUsers
                    join u in _context.Users on gu.UserId equals u.Id
                    where gu.GroupId == groupId && !u.IsDelete
                    select u;

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(u => u.UserName.Contains(keyword) || 
                                     (u.FullName != null && u.FullName.Contains(keyword)) ||
                                     (u.Email != null && u.Email.Contains(keyword)));
        }

        return await query.CountAsync();
    }

    public async Task<GroupUser?> GetByGroupIdAndUserIdAsync(int groupId, int userId)
    {
        return await _context.GroupUsers
            .FirstOrDefaultAsync(gu => gu.GroupId == groupId && gu.UserId == userId);
    }

    public async Task AddAsync(GroupUser groupUser)
    {
        await _context.GroupUsers.AddAsync(groupUser);
        await _context.SaveChangesAsync();
    }

    public async Task RemoveAsync(GroupUser groupUser)
    {
        _context.GroupUsers.Remove(groupUser);
        await _context.SaveChangesAsync();
    }

    public async Task<List<int>> GetGroupIdsByUserIdAsync(int userId)
    {
        return await _context.GroupUsers
            .AsNoTracking()
            .Where(gu => gu.UserId == userId)
            .Select(gu => gu.GroupId)
            .ToListAsync();
    }
}
