using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly LmsDbContext _context;

    public UserRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && !u.IsDelete);
    }

    public async Task<User?> GetByUserNameAsync(string userName)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.UserName == userName && !u.IsDelete);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email && !u.IsDelete);
    }

    public async Task<List<User>> GetPagedAsync(string? keyword, string? role, bool? isLocked, int page, int pageSize)
    {
        var query = _context.Users.AsNoTracking().Where(u => !u.IsDelete);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(u => u.UserName.Contains(keyword) || 
                                     (u.FullName != null && u.FullName.Contains(keyword)) || 
                                     (u.Email != null && u.Email.Contains(keyword)));
        }

        if (isLocked.HasValue)
        {
            query = query.Where(u => u.IsLocked == isLocked.Value);
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            query = from u in query
                    join ur in _context.UserRoles on u.Id equals ur.UserId
                    join r in _context.Roles on ur.RoleId equals r.Id
                    where r.Name == role
                    select u;
        }

        return await query
            .OrderByDescending(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetCountAsync(string? keyword, string? role, bool? isLocked)
    {
        var query = _context.Users.AsNoTracking().Where(u => !u.IsDelete);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(u => u.UserName.Contains(keyword) || 
                                     (u.FullName != null && u.FullName.Contains(keyword)) || 
                                     (u.Email != null && u.Email.Contains(keyword)));
        }

        if (isLocked.HasValue)
        {
            query = query.Where(u => u.IsLocked == isLocked.Value);
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            query = from u in query
                    join ur in _context.UserRoles on u.Id equals ur.UserId
                    join r in _context.Roles on ur.RoleId equals r.Id
                    where r.Name == role
                    select u;
        }

        return await query.CountAsync();
    }

    public async Task AddAsync(User user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(User user)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> HasUsersAsync()
    {
        return await _context.Users.AnyAsync(u => !u.IsDelete);
    }
}
