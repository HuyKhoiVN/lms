using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IGroupRepository
{
    Task<Group?> GetByIdAsync(int id);
    Task<Group?> GetByNameAsync(string name);
    Task<List<Group>> GetPagedAsync(string? keyword, int page, int pageSize);
    Task<int> GetCountAsync(string? keyword);
    Task AddAsync(Group group);
    Task UpdateAsync(Group group);
}
