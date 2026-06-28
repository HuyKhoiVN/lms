using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface ICourseRepository
{
    Task<Course?> GetByIdAsync(int id);
    Task<Course?> GetByCodeAsync(string code);
    Task<List<Course>> GetPagedAsync(string? keyword, bool? isPublished, int page, int pageSize);
    Task<int> GetCountAsync(string? keyword, bool? isPublished);
    Task AddAsync(Course course);
    Task UpdateAsync(Course course);
    Task<List<Course>> GetPagedAssignedToUserAsync(int userId, string? keyword, int page, int pageSize);
    Task<int> GetCountAssignedToUserAsync(int userId, string? keyword);
}
