using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public class CertificateFileRepository : ICertificateFileRepository
{
    private readonly LmsDbContext _context;

    public CertificateFileRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(CertificateFile file)
    {
        await _context.CertificateFiles.AddAsync(file);
        await _context.SaveChangesAsync();
    }

    public async Task RemoveAsync(CertificateFile file)
    {
        _context.CertificateFiles.Remove(file);
        await _context.SaveChangesAsync();
    }

    public async Task<CertificateFile?> GetByCertificateIdAsync(int certificateId)
    {
        return await _context.CertificateFiles
            .FirstOrDefaultAsync(cf => cf.CertificateId == certificateId);
    }
}
