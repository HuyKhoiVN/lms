using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using lms.Application.Interfaces.Services;

namespace lms.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _privateRoot;
    private readonly string _publicRoot;
    private readonly string _legacyRoot;

    public FileStorageService(IConfiguration configuration)
    {
        _legacyRoot = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "uploads");
        _privateRoot = ResolveRoot(configuration["Storage:PrivateRootPath"], "App_Data/uploads");
        _publicRoot = ResolveRoot(configuration["Storage:PublicRootPath"], "wwwroot/uploads");

        Directory.CreateDirectory(_privateRoot);
        Directory.CreateDirectory(_publicRoot);
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName)
    {
        return await SaveFileAsync(fileStream, fileName, "general");
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string folder)
    {
        return await SaveFileCoreAsync(fileStream, fileName, _privateRoot, folder);
    }

    public async Task<string> SavePublicFileAsync(Stream fileStream, string fileName, string folder)
    {
        return await SaveFileCoreAsync(fileStream, fileName, _publicRoot, folder);
    }

    public Task<Stream> GetFileAsync(string fileKey)
    {
        var privatePath = ResolveFilePath(_privateRoot, fileKey);
        if (File.Exists(privatePath))
        {
            Stream stream = new FileStream(privatePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            return Task.FromResult(stream);
        }

        var publicPath = ResolveFilePath(_publicRoot, fileKey);
        if (File.Exists(publicPath))
        {
            Stream stream = new FileStream(publicPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            return Task.FromResult(stream);
        }

        var legacyPath = ResolveFilePath(_legacyRoot, fileKey);
        if (File.Exists(legacyPath))
        {
            Stream stream = new FileStream(legacyPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            return Task.FromResult(stream);
        }

        throw new FileNotFoundException("Physical file not found on disk.", fileKey);
    }

    public Task DeleteFileAsync(string fileKey)
    {
        DeleteIfExists(_privateRoot, fileKey);
        DeleteIfExists(_publicRoot, fileKey);
        DeleteIfExists(_legacyRoot, fileKey);

        return Task.CompletedTask;
    }

    public string GetPublicUrl(string fileKey)
    {
        return "/uploads/" + NormalizeRelativeKey(fileKey);
    }

    private static async Task<string> SaveFileCoreAsync(Stream fileStream, string fileName, string root, string folder)
    {
        var fileExtension = Path.GetExtension(fileName);
        var uniqueKey = Guid.NewGuid().ToString("N") + fileExtension;
        var normalizedFolder = NormalizeRelativeKey(folder);
        var relativeKey = string.IsNullOrWhiteSpace(normalizedFolder)
            ? uniqueKey
            : normalizedFolder + "/" + uniqueKey;
        var fullPath = Path.Combine(root, relativeKey.Replace("/", Path.DirectorySeparatorChar.ToString()));

        var finalPath = EnsureUnderRoot(root, fullPath);
        Directory.CreateDirectory(Path.GetDirectoryName(finalPath)!);

        using var destinationStream = new FileStream(finalPath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, useAsync: true);
        await fileStream.CopyToAsync(destinationStream);

        return relativeKey;
    }

    private static string ResolveRoot(string? configuredPath, string fallbackRelativePath)
    {
        var path = string.IsNullOrWhiteSpace(configuredPath)
            ? fallbackRelativePath
            : configuredPath;

        return Path.GetFullPath(Path.IsPathRooted(path)
            ? path
            : Path.Combine(Directory.GetCurrentDirectory(), path));
    }

    private static string ResolveFilePath(string root, string fileKey)
    {
        var relativeKey = NormalizeRelativeKey(fileKey);
        var fullPath = Path.Combine(root, relativeKey.Replace("/", Path.DirectorySeparatorChar.ToString()));
        return EnsureUnderRoot(root, fullPath);
    }

    private static string EnsureUnderRoot(string root, string candidatePath)
    {
        var finalPath = Path.GetFullPath(candidatePath);
        var normalizedRoot = Path.GetFullPath(root);
        if (!normalizedRoot.EndsWith(Path.DirectorySeparatorChar))
        {
            normalizedRoot += Path.DirectorySeparatorChar;
        }

        if (!finalPath.StartsWith(normalizedRoot, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid file path / Traversal attempt detected.");
        }

        return finalPath;
    }

    private static string NormalizeRelativeKey(string value)
    {
        var normalized = (value ?? string.Empty)
            .Replace('\\', '/')
            .Trim()
            .Trim('/');

        if (normalized.Contains("..", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Invalid file key / Traversal attempt detected.");
        }

        return normalized;
    }

    private static void DeleteIfExists(string root, string fileKey)
    {
        var finalPath = ResolveFilePath(root, fileKey);
        if (File.Exists(finalPath))
        {
            File.Delete(finalPath);
        }
    }
}
