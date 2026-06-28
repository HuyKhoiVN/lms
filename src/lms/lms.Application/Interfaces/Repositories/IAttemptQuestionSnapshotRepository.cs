using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IAttemptQuestionSnapshotRepository
{
    Task<List<AttemptQuestionSnapshot>> GetByAttemptIdAsync(int attemptId);
    Task AddRangeAsync(IEnumerable<AttemptQuestionSnapshot> snapshots);
}
