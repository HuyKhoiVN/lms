using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using lms.Application.Interfaces.Services;

namespace lms.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _storageRoot;

    public FileStorageService(IConfiguration configuration)
    {
        var configPath = configuration["Storage:RootPath"];
        if (string.IsNullOrWhiteSpace(configPath))
        {
            _storageRoot = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "uploads");
        }
        else
        {
            _storageRoot = configPath;
        }

        if (!Directory.Exists(_storageRoot))
        {
            Directory.CreateDirectory(_storageRoot);
        }
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName)
    {
        var fileExtension = Path.GetExtension(fileName);
        var uniqueKey = Guid.NewGuid().ToString("N") + fileExtension;
        var fullPath = Path.Combine(_storageRoot, uniqueKey);

        var finalPath = Path.GetFullPath(fullPath);
        if (!finalPath.StartsWith(Path.GetFullPath(_storageRoot)))
        {
            throw new InvalidOperationException("Invalid file path / Traversal attempt detected.");
        }

        using var destinationStream = new FileStream(finalPath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, useAsync: true);
        await fileStream.CopyToAsync(destinationStream);

        return uniqueKey;
    }

    public Task<Stream> GetFileAsync(string fileKey)
    {
        var fullPath = Path.Combine(_storageRoot, fileKey);
        var finalPath = Path.GetFullPath(fullPath);

        if (!finalPath.StartsWith(Path.GetFullPath(_storageRoot)))
        {
            throw new InvalidOperationException("Invalid file key / Traversal attempt detected.");
        }

        if (!File.Exists(finalPath))
        {
            throw new FileNotFoundException("Physical file not found on disk.", fileKey);
        }

        Stream stream = new FileStream(finalPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult(stream);
    }

    public Task DeleteFileAsync(string fileKey)
    {
        var fullPath = Path.Combine(_storageRoot, fileKey);
        var finalPath = Path.GetFullPath(fullPath);

        if (!finalPath.StartsWith(Path.GetFullPath(_storageRoot)))
        {
            throw new InvalidOperationException("Invalid file key / Traversal attempt detected.");
        }

        if (File.Exists(finalPath))
        {
            File.Delete(finalPath);
        }

        return Task.CompletedTask;
    }
}
