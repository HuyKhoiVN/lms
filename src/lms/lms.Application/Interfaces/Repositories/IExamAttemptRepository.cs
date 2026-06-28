using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IExamAttemptRepository
{
    Task<ExamAttempt?> GetByIdAsync(int id);
    Task<ExamAttempt?> GetActiveByUserAndExamAsync(int userId, int examId);
    Task<int> GetAttemptCountAsync(int userId, int examId);
    Task<List<ExamAttempt>> GetByUserIdAsync(int userId, int page, int pageSize);
    Task<int> GetCountByUserIdAsync(int userId);
    Task AddAsync(ExamAttempt attempt);
    Task UpdateAsync(ExamAttempt attempt);
}
