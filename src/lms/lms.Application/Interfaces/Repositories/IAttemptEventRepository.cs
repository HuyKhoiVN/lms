using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IAttemptEventRepository
{
    Task AddAsync(AttemptEvent evt);
    Task<List<AttemptEvent>> GetByAttemptIdAsync(int attemptId);
}
