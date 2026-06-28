using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface ICourseExamRepository
{
    Task<List<CourseExam>> GetExamsByCourseIdAsync(int courseId);
    Task<CourseExam?> GetByIdAsync(int id);
    Task<CourseExam?> GetByCourseAndExamAsync(int courseId, int examId);
    Task<List<int>> GetCourseIdsByExamIdAsync(int examId);
    Task AddAsync(CourseExam courseExam);
    Task RemoveAsync(CourseExam courseExam);
}
