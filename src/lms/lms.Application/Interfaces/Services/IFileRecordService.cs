using System.Threading.Tasks;
using lms.Application.DTOs.Common;

namespace lms.Application.Interfaces.Services;

public interface IFileRecordService
{
    Task<ApiResponse<FileRecordResponse>> SaveFileMetadataAsync(string fileKey, string originalFileName, string contentType, long fileSize, string storageProvider, string purpose, int? userId);
    Task<ApiResponse<FileRecordResponse>> GetByIdAsync(int id);
    Task<ApiResponse<FileRecordResponse>> GetByKeyAsync(string fileKey);
    Task<ApiResponse<PagedResult<FileRecordResponse>>> GetPagedAsync(FileFilterRequest filter);

    /// <summary>
    /// Soft delete file record. Kiểm tra không có reference đang sử dụng trước khi xóa.
    /// </summary>
    Task<ApiResponse<object>> DeleteFileAsync(int id, int? userId);
}
