using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.Common;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

/// <summary>
/// Quản lý metadata file và cung cấp upload/download.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 16 File Management.
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/files")]
public class FilesController : ControllerBase
{
    private readonly IFileRecordService _fileRecordService;
    private readonly IFileStorageService _fileStorageService;
    private readonly IFileAccessService _fileAccessService;
    private readonly ICurrentUserService _currentUserService;

    public FilesController(
        IFileRecordService fileRecordService,
        IFileStorageService fileStorageService,
        IFileAccessService fileAccessService,
        ICurrentUserService currentUserService)
    {
        _fileRecordService = fileRecordService;
        _fileStorageService = fileStorageService;
        _fileAccessService = fileAccessService;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Upload file (Admin only). Trả 201 + metadata.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<FileRecordResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upload([FromForm] UploadFileForm form)
    {
        var file = form.File;
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<object>.FailureResult("Tệp tin trống hoặc không hợp lệ."));
        }

        var purpose = string.IsNullOrWhiteSpace(form.Purpose) ? "General" : form.Purpose;
        var userId = _currentUserService.UserId;

        using var stream = file.OpenReadStream();
        var fileKey = await _fileStorageService.SaveFileAsync(stream, file.FileName);

        var result = await _fileRecordService.SaveFileMetadataAsync(
            fileKey, file.FileName, file.ContentType, file.Length,
            "LocalFileSystem", purpose, userId);

        if (!result.Success)
        {
            await _fileStorageService.DeleteFileAsync(fileKey);
            return BadRequest(result);
        }

        return CreatedAtAction(nameof(GetMetadata), new { id = result.Data!.Id }, result);
    }

    /// <summary>
    /// Lấy danh sách file có phân trang (Admin only).
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<FileRecordResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged([FromQuery] FileFilterRequest filter)
    {
        var result = await _fileRecordService.GetPagedAsync(filter);
        return Ok(result);
    }

    /// <summary>
    /// Lấy metadata file theo id (Admin only).
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<FileRecordResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMetadata(int id)
    {
        var result = await _fileRecordService.GetByIdAsync(id);
        if (!result.Success)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Download file — kiểm tra quyền truy cập theo purpose/owner.
    /// </summary>
    [HttpGet("{id}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Download(int id)
    {
        var metadataResult = await _fileRecordService.GetByIdAsync(id);
        if (!metadataResult.Success)
        {
            return NotFound(metadataResult);
        }

        var userId = _currentUserService.UserId;
        if (!userId.HasValue || !await _fileAccessService.HasAccessAsync(userId.Value, metadataResult.Data!.FileKey))
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                ApiResponse<object>.FailureResult("Bạn không có quyền tải tệp này."));
        }

        var fileStream = await _fileStorageService.GetFileAsync(metadataResult.Data.FileKey);
        return File(fileStream, metadataResult.Data.ContentType, metadataResult.Data.OriginalFileName);
    }

    /// <summary>
    /// Soft delete / mark archive file metadata (Admin only).
    /// Không xóa physical file trừ khi không còn reference.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = _currentUserService.UserId;
        var result = await _fileRecordService.DeleteFileAsync(id, userId);
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("Không tìm thấy"))
            {
                return NotFound(result);
            }
            if (result.Message != null && result.Message.Contains("đang được sử dụng"))
            {
                return Conflict(result);
            }
            return BadRequest(result);
        }
        return NoContent();
    }
}
