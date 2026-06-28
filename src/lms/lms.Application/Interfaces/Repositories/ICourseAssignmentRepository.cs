using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface ICourseAssignmentRepository
{
    Task<CourseAssignment?> GetByIdAsync(int id);
    Task<CourseAssignment?> GetByCourseIdAndUserIdAsync(int courseId, int userId);
    Task AddAsync(CourseAssignment assignment);
    Task RemoveAsync(CourseAssignment assignment);
    Task<List<CourseAssignment>> GetByCourseIdAsync(int courseId);
}
