using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.Certificates;
using lms.Application.DTOs.Common;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/certificates")]
public sealed class CertificatesController : ControllerBase
{
    private readonly ICertificateService _certificates;
    private readonly IFileStorageService _fileStorage;
    private readonly ICurrentUserService _currentUser;

    public CertificatesController(
        ICertificateService certificates,
        IFileStorageService fileStorage,
        ICurrentUserService currentUser)
    {
        _certificates = certificates;
        _fileStorage = fileStorage;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CertificateListItemResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged([FromQuery] CertificateFilterRequest filter)
    {
        var result = await _certificates.GetPagedAsync(filter, _currentUser.UserId, IsAdmin());
        if (!result.Success) return Unauthorized(result);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CertificateDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _certificates.GetByIdAsync(id, _currentUser.UserId, IsAdmin());
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("quyen")) return StatusCode(StatusCodes.Status403Forbidden, result);
            return NotFound(result);
        }
        return Ok(result);
    }

    [Authorize(Roles = "Admin,System")]
    [HttpPost("generate")]
    [ProducesResponseType(typeof(ApiResponse<CertificateDetailResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Generate([FromBody] GenerateCertificateRequest request)
    {
        var result = await _certificates.GenerateAsync(request, _currentUser.UserId);
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("da ton tai")) return Conflict(result);
            return BadRequest(result);
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpGet("{id}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Download(int id)
    {
        var result = await _certificates.GetDownloadFileAsync(id, _currentUser.UserId, IsAdmin());
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("quyen")) return StatusCode(StatusCodes.Status403Forbidden, result);
            return NotFound(result);
        }

        var file = result.Data!;
        var stream = await _fileStorage.GetFileAsync(file.StoragePath);
        return File(stream, "text/html; charset=utf-8", file.OriginalFileName);
    }

    private bool IsAdmin() => _currentUser.Role == "Admin";
}
