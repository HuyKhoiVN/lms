using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class LearningMaterialFileRepository : ILearningMaterialFileRepository
{
    private readonly LmsDbContext _context;

    public LearningMaterialFileRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task<List<LearningMaterialFile>> GetByMaterialIdAsync(int materialId)
    {
        return await _context.LearningMaterialFiles
            .AsNoTracking()
            .Where(x => x.LearningMaterialId == materialId)
            .ToListAsync();
    }

    public async Task<LearningMaterialFile?> GetByIdAsync(int id)
    {
        return await _context.LearningMaterialFiles
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task AddAsync(LearningMaterialFile file)
    {
        await _context.LearningMaterialFiles.AddAsync(file);
        await _context.SaveChangesAsync();
    }

    public async Task RemoveAsync(LearningMaterialFile file)
    {
        _context.LearningMaterialFiles.Remove(file);
        await _context.SaveChangesAsync();
    }
}
