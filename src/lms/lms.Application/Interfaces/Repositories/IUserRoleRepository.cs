using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IUserRoleRepository
{
    Task<List<string>> GetRolesByUserIdAsync(int userId);
    Task<UserRole?> GetByUserIdAndRoleIdAsync(int userId, int roleId);
    Task AddAsync(UserRole userRole);
    Task RemoveAsync(UserRole userRole);
    Task RemoveAllByUserIdAsync(int userId);
}
