using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

/// <summary>
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 7 Question Bank.
/// </summary>
public interface IQuestionCategoryRepository
{
    Task<QuestionCategory?> GetByIdAsync(int id);
    Task<QuestionCategory?> GetByNameAsync(string name);
    Task<List<QuestionCategory>> GetPagedAsync(string? keyword, int? parentCategoryId, int page, int pageSize);
    Task<int> GetCountAsync(string? keyword, int? parentCategoryId);
    Task<bool> HasQuestionsAsync(int categoryId);
    Task AddAsync(QuestionCategory category);
    Task UpdateAsync(QuestionCategory category);
}
