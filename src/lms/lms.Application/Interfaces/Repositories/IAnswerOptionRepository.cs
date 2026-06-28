using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

/// <summary>
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 7 Question Bank.
/// </summary>
public interface IAnswerOptionRepository
{
    Task<List<AnswerOption>> GetByQuestionIdAsync(int questionId);
    Task<AnswerOption?> GetByIdAsync(int id);
    Task AddRangeAsync(IEnumerable<AnswerOption> options);
    Task UpdateAsync(AnswerOption option);
    Task RemoveRangeAsync(IEnumerable<AnswerOption> options);
    Task RemoveByQuestionIdAsync(int questionId);
}
