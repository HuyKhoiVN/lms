using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IExamAssignmentRepository
{
    Task<ExamAssignment?> GetByIdAsync(int id);
    Task<ExamAssignment?> GetByExamAndUserAsync(int examId, int userId);
    Task<List<ExamAssignment>> GetByExamIdAsync(int examId);
    Task<List<ExamAssignment>> GetByUserIdAsync(int userId);
    Task<List<int>> GetExamIdsByUserIdAsync(int userId);
    Task AddAsync(ExamAssignment assignment);
    Task RemoveAsync(ExamAssignment assignment);
}
