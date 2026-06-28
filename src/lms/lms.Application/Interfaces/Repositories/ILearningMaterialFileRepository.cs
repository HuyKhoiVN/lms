using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

/// <summary>
/// Repository cho LearningMaterialFile — metadata file đính kèm hoc lieu.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 5 Learning Material.
/// </summary>
public interface ILearningMaterialFileRepository
{
    Task<List<LearningMaterialFile>> GetByMaterialIdAsync(int materialId);
    Task<LearningMaterialFile?> GetByIdAsync(int id);
    Task AddAsync(LearningMaterialFile file);
    Task RemoveAsync(LearningMaterialFile file);
}
