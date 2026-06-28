using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IAttemptAnswerRepository
{
    Task<List<AttemptAnswer>> GetByAttemptIdAsync(int attemptId);
    Task<List<AttemptAnswer>> GetByAttemptAndQuestionAsync(int attemptId, int questionId);
    Task RemoveByAttemptAndQuestionAsync(int attemptId, int questionId);
    Task AddRangeAsync(IEnumerable<AttemptAnswer> answers);
}
