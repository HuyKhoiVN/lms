using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

/// <summary>
/// Repository cho LearningProgress.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 6 Learning Progress.
/// </summary>
public interface ILearningProgressRepository
{
    Task<LearningProgress?> GetByUserAndMaterialAsync(int userId, int materialId);
    Task<List<LearningProgress>> GetByUserAsync(int userId, int? courseId, int page, int pageSize);
    Task<int> GetCountByUserAsync(int userId, int? courseId);
    Task<List<LearningProgress>> GetByCourseAsync(int courseId);
    Task AddAsync(LearningProgress progress);
    Task UpdateAsync(LearningProgress progress);
}
