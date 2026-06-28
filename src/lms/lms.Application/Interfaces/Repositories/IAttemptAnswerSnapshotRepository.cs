using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IAttemptAnswerSnapshotRepository
{
    Task<List<AttemptAnswerSnapshot>> GetByAttemptIdAsync(int attemptId);
    Task<List<AttemptAnswerSnapshot>> GetByAttemptAndQuestionAsync(int attemptId, int questionId);
    Task AddRangeAsync(IEnumerable<AttemptAnswerSnapshot> snapshots);
}
