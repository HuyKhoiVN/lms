using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IExamResultRepository
{
    Task<ExamResult?> GetByIdAsync(int id);
    Task<ExamResult?> GetByAttemptIdAsync(int attemptId);
    Task<List<ExamResult>> GetByUserIdAsync(int userId, int? examId, string? keyword, bool? passed, int page, int pageSize);
    Task<int> GetCountByUserIdAsync(int userId, int? examId, string? keyword, bool? passed);
    Task<List<ExamResult>> GetPagedAsync(int? examId, int? userId, string? keyword, bool? passed, int page, int pageSize);
    Task<int> GetCountAsync(int? examId, int? userId, string? keyword, bool? passed);
    Task AddAsync(ExamResult result);
}
