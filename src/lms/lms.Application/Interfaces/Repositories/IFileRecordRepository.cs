using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IFileRecordRepository
{
    Task<FileRecord?> GetByIdAsync(int id);
    Task<FileRecord?> GetByKeyAsync(string fileKey);
    Task AddAsync(FileRecord fileRecord);
    Task UpdateAsync(FileRecord fileRecord);
    Task<List<FileRecord>> GetPagedAsync(string? keyword, string? purpose, int page, int pageSize);
    Task<int> GetCountAsync(string? keyword, string? purpose);
}
