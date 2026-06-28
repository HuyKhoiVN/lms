using System.Threading.Tasks;

namespace lms.Application.Interfaces.Services;

public interface IFileAccessService
{
    Task<bool> HasAccessAsync(int userId, string fileKey);
}
