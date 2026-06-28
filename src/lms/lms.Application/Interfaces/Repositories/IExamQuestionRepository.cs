using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IExamQuestionRepository
{
    Task<List<ExamQuestion>> GetByExamIdAsync(int examId);
    Task<ExamQuestion?> GetByExamAndQuestionAsync(int examId, int questionId);
    Task<int> GetCountByExamIdAsync(int examId);
    Task AddAsync(ExamQuestion examQuestion);
    Task UpdateAsync(ExamQuestion examQuestion);
    Task RemoveAsync(ExamQuestion examQuestion);
    Task RemoveByExamIdAsync(int examId);
}
