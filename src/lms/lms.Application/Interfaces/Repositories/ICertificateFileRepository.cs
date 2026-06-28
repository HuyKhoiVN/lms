using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface ICertificateFileRepository
{
    Task AddAsync(CertificateFile file);
    Task RemoveAsync(CertificateFile file);
    Task<CertificateFile?> GetByCertificateIdAsync(int certificateId);
}
