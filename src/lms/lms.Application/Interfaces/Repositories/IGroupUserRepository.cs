using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IGroupUserRepository
{
    Task<List<User>> GetMembersAsync(int groupId, string? keyword, int page, int pageSize);
    Task<int> GetMembersCountAsync(int groupId, string? keyword);
    Task<GroupUser?> GetByGroupIdAndUserIdAsync(int groupId, int userId);
    Task AddAsync(GroupUser groupUser);
    Task RemoveAsync(GroupUser groupUser);
    Task<List<int>> GetGroupIdsByUserIdAsync(int userId);
}
