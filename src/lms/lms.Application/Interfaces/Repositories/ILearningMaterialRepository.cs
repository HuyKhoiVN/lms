using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

/// <summary>
/// Repository cho LearningMaterial.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 5 Learning Material.
/// Không dùng FK constraint — CourseId là logical reference, validate trong service.
/// </summary>
public interface ILearningMaterialRepository
{
    Task<LearningMaterial?> GetByIdAsync(int id);
    Task<List<LearningMaterial>> GetByCourseIdAsync(int courseId);
    Task<List<LearningMaterial>> GetPagedAsync(int? courseId, string? keyword, string? contentType, int page, int pageSize);
    Task<int> GetCountAsync(int? courseId, string? keyword, string? contentType);
    Task AddAsync(LearningMaterial material);
    Task UpdateAsync(LearningMaterial material);
}
