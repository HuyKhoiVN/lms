using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public class FileRecordRepository : IFileRecordRepository
{
    private readonly LmsDbContext _context;

    public FileRecordRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task<FileRecord?> GetByIdAsync(int id)
    {
        return await _context.FileRecords
            .FirstOrDefaultAsync(fr => fr.Id == id && !fr.IsDelete);
    }

    public async Task<FileRecord?> GetByKeyAsync(string fileKey)
    {
        return await _context.FileRecords
            .FirstOrDefaultAsync(fr => fr.FileKey == fileKey && !fr.IsDelete);
    }

    public async Task AddAsync(FileRecord fileRecord)
    {
        await _context.FileRecords.AddAsync(fileRecord);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(FileRecord fileRecord)
    {
        _context.FileRecords.Update(fileRecord);
        await _context.SaveChangesAsync();
    }

    public async Task<List<FileRecord>> GetPagedAsync(string? keyword, string? purpose, int page, int pageSize)
    {
        var query = _context.FileRecords.AsNoTracking().Where(fr => !fr.IsDelete);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(fr => fr.OriginalFileName.Contains(keyword) || 
                                     fr.FileKey.Contains(keyword));
        }

        if (!string.IsNullOrWhiteSpace(purpose))
        {
            query = query.Where(fr => fr.Purpose == purpose);
        }

        return await query
            .OrderByDescending(fr => fr.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetCountAsync(string? keyword, string? purpose)
    {
        var query = _context.FileRecords.AsNoTracking().Where(fr => !fr.IsDelete);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(fr => fr.OriginalFileName.Contains(keyword) || 
                                     fr.FileKey.Contains(keyword));
        }

        if (!string.IsNullOrWhiteSpace(purpose))
        {
            query = query.Where(fr => fr.Purpose == purpose);
        }

        return await query.CountAsync();
    }
}
