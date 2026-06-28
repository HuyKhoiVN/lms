using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

/// <summary>
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 7 Question Bank.
/// </summary>
public interface IQuestionRepository
{
    Task<Question?> GetByIdAsync(int id);
    Task<List<Question>> GetPagedAsync(int? categoryId, string? keyword, string? difficulty, string? questionType, int page, int pageSize);
    Task<int> GetCountAsync(int? categoryId, string? keyword, string? difficulty, string? questionType);
    /// <summary>Lấy random N câu theo category + difficulty (dùng cho exam random rule).</summary>
    Task<List<Question>> GetRandomAsync(int categoryId, string difficulty, int count);
    Task AddAsync(Question question);
    Task UpdateAsync(Question question);
}
