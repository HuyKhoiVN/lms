using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface ICertificateRepository
{
    Task<Certificate?> GetByIdAsync(int id);
    Task<Certificate?> GetByUserAndExamAsync(int userId, int examId);
    Task<List<Certificate>> GetPagedAsync(int? userId, int? examId, int page, int pageSize);
    Task<int> GetCountAsync(int? userId, int? examId);
    Task AddAsync(Certificate certificate);
}
