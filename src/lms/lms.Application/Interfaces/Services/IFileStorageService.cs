using System.IO;
using System.Threading.Tasks;

namespace lms.Application.Interfaces.Services;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(Stream fileStream, string fileName);
    Task<Stream> GetFileAsync(string fileKey);
    Task DeleteFileAsync(string fileKey);
}
