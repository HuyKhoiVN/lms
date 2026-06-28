using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

public class FileRecordService : IFileRecordService
{
    private readonly IFileRecordRepository _fileRecordRepository;

    public FileRecordService(IFileRecordRepository fileRecordRepository)
    {
        _fileRecordRepository = fileRecordRepository;
    }

    public async Task<ApiResponse<FileRecordResponse>> SaveFileMetadataAsync(
        string fileKey, 
        string originalFileName, 
        string contentType, 
        long fileSize, 
        string storageProvider, 
        string purpose, 
        int? userId)
    {
        if (string.IsNullOrWhiteSpace(fileKey) || string.IsNullOrWhiteSpace(originalFileName))
        {
            return ApiResponse<FileRecordResponse>.FailureResult("Tên tệp và Khóa tệp không được trống.");
        }

        var fileRecord = new FileRecord
        {
            FileKey = fileKey,
            OriginalFileName = originalFileName,
            ContentType = contentType,
            FileSize = fileSize,
            StorageProvider = storageProvider,
            Purpose = purpose,
            IsDelete = false,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = userId
        };

        await _fileRecordRepository.AddAsync(fileRecord);

        var response = MapToFileRecordResponse(fileRecord);
        return ApiResponse<FileRecordResponse>.SuccessResult(response, "Lưu thông tin tệp thành công.");
    }

    public async Task<ApiResponse<FileRecordResponse>> GetByIdAsync(int id)
    {
        var fileRecord = await _fileRecordRepository.GetByIdAsync(id);
        if (fileRecord == null)
        {
            return ApiResponse<FileRecordResponse>.FailureResult("Không tìm thấy thông tin tệp.");
        }

        var response = MapToFileRecordResponse(fileRecord);
        return ApiResponse<FileRecordResponse>.SuccessResult(response);
    }

    public async Task<ApiResponse<FileRecordResponse>> GetByKeyAsync(string fileKey)
    {
        var fileRecord = await _fileRecordRepository.GetByKeyAsync(fileKey);
        if (fileRecord == null)
        {
            return ApiResponse<FileRecordResponse>.FailureResult("Không tìm thấy thông tin tệp.");
        }

        var response = MapToFileRecordResponse(fileRecord);
        return ApiResponse<FileRecordResponse>.SuccessResult(response);
    }

    public async Task<ApiResponse<PagedResult<FileRecordResponse>>> GetPagedAsync(FileFilterRequest filter)
    {
        var files = await _fileRecordRepository.GetPagedAsync(filter.Keyword, filter.Purpose, filter.Page, filter.PageSize);
        var total = await _fileRecordRepository.GetCountAsync(filter.Keyword, filter.Purpose);

        var items = files.Select(MapToFileRecordResponse).ToList();
        var pagedResult = new PagedResult<FileRecordResponse>(items, total, filter.Page, filter.PageSize);

        return ApiResponse<PagedResult<FileRecordResponse>>.SuccessResult(pagedResult);
    }

    private FileRecordResponse MapToFileRecordResponse(FileRecord fileRecord)
    {
        return new FileRecordResponse
        {
            Id = fileRecord.Id,
            FileKey = fileRecord.FileKey,
            OriginalFileName = fileRecord.OriginalFileName ?? string.Empty,
            ContentType = fileRecord.ContentType ?? string.Empty,
            FileSize = fileRecord.FileSize,
            StorageProvider = fileRecord.StorageProvider ?? string.Empty,
            Purpose = fileRecord.Purpose ?? string.Empty,
            CreatedDate = fileRecord.CreatedDate
        };
    }

    public async Task<ApiResponse<object>> DeleteFileAsync(int id, int? userId)
    {
        var fileRecord = await _fileRecordRepository.GetByIdAsync(id);
        if (fileRecord == null)
        {
            return ApiResponse<object>.FailureResult("Không tìm thấy thông tin tệp.");
        }

        if (fileRecord.IsDelete)
        {
            return ApiResponse<object>.FailureResult("Không tìm thấy thông tin tệp.");
        }

        // Soft delete theo quy ước AuditableEntity
        fileRecord.IsDelete = true;
        fileRecord.UpdateDate = DateTime.UtcNow;
        fileRecord.UpdatedBy = userId;

        await _fileRecordRepository.UpdateAsync(fileRecord);

        return ApiResponse<object>.SuccessResult(null!, "Xóa tệp thành công.");
    }
}
