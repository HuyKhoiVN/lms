using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface ILearningMaterialBlockRepository
{
    Task<List<LearningMaterialBlock>> GetByMaterialIdAsync(int materialId);
    Task<LearningMaterialBlock?> GetByIdAsync(int id);
    Task AddAsync(LearningMaterialBlock block);
    Task UpdateAsync(LearningMaterialBlock block);
    Task UpdateRangeAsync(IEnumerable<LearningMaterialBlock> blocks);
}
