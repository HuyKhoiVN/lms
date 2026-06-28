using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class CertificateRepository : ICertificateRepository
{
    private readonly LmsDbContext _ctx;

    public CertificateRepository(LmsDbContext ctx)
    {
        _ctx = ctx;
    }

    public Task<Certificate?> GetByIdAsync(int id) =>
        _ctx.Certificates.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete);

    public Task<Certificate?> GetByUserAndExamAsync(int userId, int examId) =>
        _ctx.Certificates.AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId && x.ExamId == examId && !x.IsDelete);

    public Task<List<Certificate>> GetPagedAsync(int? userId, int? examId, int page, int pageSize)
    {
        var query = _ctx.Certificates.AsNoTracking().Where(x => !x.IsDelete);
        if (userId.HasValue) query = query.Where(x => x.UserId == userId.Value);
        if (examId.HasValue) query = query.Where(x => x.ExamId == examId.Value);

        return query.OrderByDescending(x => x.IssuedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public Task<int> GetCountAsync(int? userId, int? examId)
    {
        var query = _ctx.Certificates.AsNoTracking().Where(x => !x.IsDelete);
        if (userId.HasValue) query = query.Where(x => x.UserId == userId.Value);
        if (examId.HasValue) query = query.Where(x => x.ExamId == examId.Value);
        return query.CountAsync();
    }

    public async Task AddAsync(Certificate certificate)
    {
        await _ctx.Certificates.AddAsync(certificate);
        await _ctx.SaveChangesAsync();
    }
}
