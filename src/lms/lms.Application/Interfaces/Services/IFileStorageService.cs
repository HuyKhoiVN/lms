using System.IO;
using System.Threading.Tasks;

namespace lms.Application.Interfaces.Services;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(Stream fileStream, string fileName);
    Task<string> SaveFileAsync(Stream fileStream, string fileName, string folder);
    Task<string> SavePublicFileAsync(Stream fileStream, string fileName, string folder);
    Task<Stream> GetFileAsync(string fileKey);
    Task DeleteFileAsync(string fileKey);
    string GetPublicUrl(string fileKey);
}
