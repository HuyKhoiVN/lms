using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.LearningMaterials;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

/// <summary>
/// Quản lý học liệu (Admin CRUD, Student read assigned).
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 5 Learning Material.
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/learning-materials")]
public class LearningMaterialsController : ControllerBase
{
    private readonly ILearningMaterialService _service;
    private readonly IMaterialAccessService _accessService;
    private readonly ICurrentUserService _currentUser;

    public LearningMaterialsController(
        ILearningMaterialService service,
        IMaterialAccessService accessService,
        ICurrentUserService currentUser)
    {
        _service = service;
        _accessService = accessService;
        _currentUser = currentUser;
    }

    /// <summary>Danh sách học liệu có phân trang. Student chỉ thấy course được assign.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<LearningMaterialListItemResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged([FromQuery] LearningMaterialFilterRequest filter)
    {
        var role = _currentUser.Role;
        int? studentId = role == "Student" ? _currentUser.UserId : null;

        var result = await _service.GetPagedAsync(filter, studentId);
        return Ok(result);
    }

    /// <summary>Chi tiết học liệu (có file đính kèm). Student cần được assign course.</summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<LearningMaterialDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var role = _currentUser.Role;
        if (role == "Student")
        {
            var uid = _currentUser.UserId;
            if (!uid.HasValue || !await _accessService.HasAccessAsync(uid.Value, id))
            {
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    ApiResponse<object>.FailureResult("Bạn không có quyền truy cập học liệu này."));
            }
        }

        var result = await _service.GetByIdAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    /// <summary>Tạo học liệu mới (Admin only).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<LearningMaterialDetailResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreateLearningMaterialRequest request)
    {
        var adminId = _currentUser.UserId;
        var result = await _service.CreateAsync(request, adminId);
        if (!result.Success)
        {
            return result.Message!.Contains("tìm thấy") ? NotFound(result) : BadRequest(result);
        }
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    /// <summary>Cập nhật học liệu (Admin only). Không thay đổi ContentType.</summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<LearningMaterialDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLearningMaterialRequest request)
    {
        var adminId = _currentUser.UserId;
        var result = await _service.UpdateAsync(id, request, adminId);
        if (!result.Success)
        {
            return result.Message!.Contains("tìm thấy") ? NotFound(result) : BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>Soft delete học liệu (Admin only). Trả 204 No Content.</summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id)
    {
        var adminId = _currentUser.UserId;
        var result = await _service.DeleteAsync(id, adminId);
        if (!result.Success)
        {
            return result.Message!.Contains("tìm thấy") ? NotFound(result) : BadRequest(result);
        }
        return NoContent();
    }
}
