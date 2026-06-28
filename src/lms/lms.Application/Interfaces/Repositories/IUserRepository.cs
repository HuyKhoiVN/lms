using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByUserNameAsync(string userName);
    Task<User?> GetByEmailAsync(string email);
    Task<List<User>> GetPagedAsync(string? keyword, string? role, bool? isLocked, int page, int pageSize);
    Task<int> GetCountAsync(string? keyword, string? role, bool? isLocked);
    Task AddAsync(User user);
    Task UpdateAsync(User user);
    Task<bool> HasUsersAsync();
}
