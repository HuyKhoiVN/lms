using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class LearningMaterialBlockRepository : ILearningMaterialBlockRepository
{
    private readonly LmsDbContext _context;

    public LearningMaterialBlockRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task<List<LearningMaterialBlock>> GetByMaterialIdAsync(int materialId)
    {
        return await _context.LearningMaterialBlocks
            .AsNoTracking()
            .Where(x => x.LearningMaterialId == materialId && !x.IsDelete)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Id)
            .ToListAsync();
    }

    public async Task<LearningMaterialBlock?> GetByIdAsync(int id)
    {
        return await _context.LearningMaterialBlocks
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete);
    }

    public async Task AddAsync(LearningMaterialBlock block)
    {
        await _context.LearningMaterialBlocks.AddAsync(block);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(LearningMaterialBlock block)
    {
        _context.LearningMaterialBlocks.Update(block);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateRangeAsync(IEnumerable<LearningMaterialBlock> blocks)
    {
        _context.LearningMaterialBlocks.UpdateRange(blocks);
        await _context.SaveChangesAsync();
    }
}
