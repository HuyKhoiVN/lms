using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IExamResultDetailRepository
{
    Task<List<ExamResultDetail>> GetByResultIdAsync(int resultId);
    Task AddRangeAsync(IEnumerable<ExamResultDetail> details);
}
