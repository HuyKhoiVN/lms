using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.LearningMaterials;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/learning-materials")]
public class LearningMaterialsController : ControllerBase
{
    private readonly ILearningMaterialService _service;
    private readonly IMaterialAccessService _accessService;
    private readonly ICurrentUserService _currentUser;
    private readonly IFileStorageService _fileStorage;

    public LearningMaterialsController(
        ILearningMaterialService service,
        IMaterialAccessService accessService,
        ICurrentUserService currentUser,
        IFileStorageService fileStorage)
    {
        _service = service;
        _accessService = accessService;
        _currentUser = currentUser;
        _fileStorage = fileStorage;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<LearningMaterialListItemResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged([FromQuery] LearningMaterialFilterRequest filter)
    {
        var role = _currentUser.Role;
        int? studentId = role == "Student" ? _currentUser.UserId : null;

        var result = await _service.GetPagedAsync(filter, studentId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<LearningMaterialDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var forbidden = await ForbidIfNoAccessAsync(id);
        if (forbidden != null) return forbidden;

        var result = await _service.GetByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("{id}/blocks")]
    [ProducesResponseType(typeof(ApiResponse<List<LearningMaterialBlockResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBlocks(int id)
    {
        var forbidden = await ForbidIfNoAccessAsync(id);
        if (forbidden != null) return forbidden;

        var result = await _service.GetBlocksAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<LearningMaterialDetailResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreateLearningMaterialRequest request)
    {
        var result = await _service.CreateAsync(request, _currentUser.UserId);
        if (!result.Success)
        {
            return result.Message != null && result.Message.Contains("Khong tim thay")
                ? NotFound(result)
                : BadRequest(result);
        }
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<LearningMaterialDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLearningMaterialRequest request)
    {
        var result = await _service.UpdateAsync(id, request, _currentUser.UserId);
        if (!result.Success)
        {
            return result.Message != null && result.Message.Contains("Khong tim thay")
                ? NotFound(result)
                : BadRequest(result);
        }
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/blocks/text")]
    [ProducesResponseType(typeof(ApiResponse<LearningMaterialBlockResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddTextBlock(int id, [FromBody] CreateTextMaterialBlockRequest request)
    {
        var result = await _service.AddTextBlockAsync(id, request, _currentUser.UserId);
        return MapBlockWriteResult(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/blocks/link")]
    [ProducesResponseType(typeof(ApiResponse<LearningMaterialBlockResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddLinkBlock(int id, [FromBody] CreateLinkMaterialBlockRequest request)
    {
        var result = await _service.AddLinkBlockAsync(id, request, _currentUser.UserId);
        return MapBlockWriteResult(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/blocks/file")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<LearningMaterialBlockResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddFileBlock(int id, [FromForm] UploadMaterialBlockFileForm form)
    {
        if (form.File == null || form.File.Length == 0)
        {
            return BadRequest(ApiResponse<object>.FailureResult("Tep tin trong hoac khong hop le."));
        }

        await using var stream = form.File.OpenReadStream();
        var result = await _service.AddFileBlockAsync(
            id, form, stream, form.File.FileName, form.File.ContentType, form.File.Length, _currentUser.UserId);
        return MapBlockWriteResult(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/blocks/{blockId}")]
    [ProducesResponseType(typeof(ApiResponse<LearningMaterialBlockResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateBlock(int id, int blockId, [FromBody] UpdateLearningMaterialBlockRequest request)
    {
        var result = await _service.UpdateBlockAsync(id, blockId, request, _currentUser.UserId);
        return MapBlockWriteResult(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/blocks/reorder")]
    [ProducesResponseType(typeof(ApiResponse<List<LearningMaterialBlockResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ReorderBlocks(int id, [FromBody] ReorderLearningMaterialBlocksRequest request)
    {
        var result = await _service.ReorderBlocksAsync(id, request, _currentUser.UserId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}/blocks/{blockId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteBlock(int id, int blockId)
    {
        var result = await _service.DeleteBlockAsync(id, blockId, _currentUser.UserId);
        if (!result.Success)
        {
            return result.Message != null && result.Message.Contains("Khong tim thay")
                ? NotFound(result)
                : BadRequest(result);
        }

        return NoContent();
    }

    [HttpGet("{materialId}/blocks/{blockId}/stream")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StreamBlock(int materialId, int blockId)
    {
        var forbidden = await ForbidIfNoAccessAsync(materialId);
        if (forbidden != null) return forbidden;

        var result = await _service.GetBlockAsync(materialId, blockId);
        if (!result.Success || result.Data == null) return NotFound(result);
        if (!result.Data.CanStream || string.IsNullOrWhiteSpace(result.Data.FileKey))
            return BadRequest(ApiResponse<object>.FailureResult("Khoi noi dung nay khong ho tro xem truc tiep."));

        try
        {
            var stream = await _fileStorage.GetFileAsync(result.Data.FileKey);
            return File(stream, result.Data.ContentType ?? "application/octet-stream", enableRangeProcessing: true);
        }
        catch (System.IO.FileNotFoundException)
        {
            return NotFound(ApiResponse<object>.FailureResult("Khong tim thay file vat ly."));
        }
    }

    [HttpGet("{materialId}/blocks/{blockId}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadBlock(int materialId, int blockId)
    {
        var forbidden = await ForbidIfNoAccessAsync(materialId);
        if (forbidden != null) return forbidden;

        var result = await _service.GetBlockAsync(materialId, blockId);
        if (!result.Success || result.Data == null) return NotFound(result);
        if (!result.Data.CanDownload || string.IsNullOrWhiteSpace(result.Data.FileKey))
            return BadRequest(ApiResponse<object>.FailureResult("Khoi noi dung nay khong co file de tai."));

        try
        {
            var stream = await _fileStorage.GetFileAsync(result.Data.FileKey);
            return File(
                stream,
                result.Data.ContentType ?? "application/octet-stream",
                result.Data.OriginalFileName ?? $"material-block-{blockId}");
        }
        catch (System.IO.FileNotFoundException)
        {
            return NotFound(ApiResponse<object>.FailureResult("Khong tim thay file vat ly."));
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id, _currentUser.UserId);
        if (!result.Success)
        {
            return result.Message != null && result.Message.Contains("Khong tim thay")
                ? NotFound(result)
                : BadRequest(result);
        }
        return NoContent();
    }

    private async Task<IActionResult?> ForbidIfNoAccessAsync(int materialId)
    {
        if (_currentUser.Role != "Student")
        {
            return null;
        }

        var userId = _currentUser.UserId;
        if (!userId.HasValue || !await _accessService.HasAccessAsync(userId.Value, materialId))
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                ApiResponse<object>.FailureResult("Ban khong co quyen truy cap hoc lieu nay."));
        }

        return null;
    }

    private IActionResult MapBlockWriteResult(ApiResponse<LearningMaterialBlockResponse> result)
    {
        if (result.Success)
        {
            return Ok(result);
        }

        return result.Message != null && result.Message.Contains("Khong tim thay")
            ? NotFound(result)
            : BadRequest(result);
    }
}
