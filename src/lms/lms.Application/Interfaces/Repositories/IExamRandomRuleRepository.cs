using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IExamRandomRuleRepository
{
    Task<List<ExamRandomRule>> GetByExamIdAsync(int examId);
    Task RemoveByExamIdAsync(int examId);
    Task AddRangeAsync(IEnumerable<ExamRandomRule> rules);
}
