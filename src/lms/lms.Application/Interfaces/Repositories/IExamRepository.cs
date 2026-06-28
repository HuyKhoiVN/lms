using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

/// <summary>Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 8.</summary>
public interface IExamRepository
{
    Task<Exam?> GetByIdAsync(int id);
    Task<Exam?> GetByCodeAsync(string code);
    Task<List<Exam>> GetPagedAsync(string? keyword, bool? isPublished, int page, int pageSize);
    Task<int> GetCountAsync(string? keyword, bool? isPublished);
    /// <summary>Exams visible to a student (assigned direct, via group, or via course).</summary>
    Task<List<Exam>> GetPagedForStudentAsync(int userId, string? keyword, int page, int pageSize);
    Task<int> GetCountForStudentAsync(int userId, string? keyword);
    Task AddAsync(Exam exam);
    Task UpdateAsync(Exam exam);
}
