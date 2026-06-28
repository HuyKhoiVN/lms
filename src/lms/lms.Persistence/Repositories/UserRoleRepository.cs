using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public class UserRoleRepository : IUserRoleRepository
{
    private readonly LmsDbContext _context;

    public UserRoleRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task<List<string>> GetRolesByUserIdAsync(int userId)
    {
        return await (from ur in _context.UserRoles
                      join r in _context.Roles on ur.RoleId equals r.Id
                      where ur.UserId == userId && !r.IsDelete
                      select r.Name).ToListAsync();
    }

    public async Task<UserRole?> GetByUserIdAndRoleIdAsync(int userId, int roleId)
    {
        return await _context.UserRoles
            .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId);
    }

    public async Task AddAsync(UserRole userRole)
    {
        await _context.UserRoles.AddAsync(userRole);
        await _context.SaveChangesAsync();
    }

    public async Task RemoveAsync(UserRole userRole)
    {
        _context.UserRoles.Remove(userRole);
        await _context.SaveChangesAsync();
    }

    public async Task RemoveAllByUserIdAsync(int userId)
    {
        var userRoles = await _context.UserRoles
            .Where(ur => ur.UserId == userId)
            .ToListAsync();
        if (userRoles.Any())
        {
            _context.UserRoles.RemoveRange(userRoles);
            await _context.SaveChangesAsync();
        }
    }
}
