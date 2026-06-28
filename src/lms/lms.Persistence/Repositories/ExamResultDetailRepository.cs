using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class ExamResultDetailRepository : IExamResultDetailRepository
{
    private readonly LmsDbContext _ctx;
    public ExamResultDetailRepository(LmsDbContext ctx) => _ctx = ctx;

    public Task<List<ExamResultDetail>> GetByResultIdAsync(int resultId) =>
        _ctx.ExamResultDetails.AsNoTracking().Where(x => x.ExamResultId == resultId).ToListAsync();

    public async Task AddRangeAsync(IEnumerable<ExamResultDetail> details)
    { await _ctx.ExamResultDetails.AddRangeAsync(details); await _ctx.SaveChangesAsync(); }
}
