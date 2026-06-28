using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.LearningProgress;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

/// <summary>
/// Theo dõi tiến độ học tập của học viên.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 6 Learning Progress.
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/learning-progress")]
public class LearningProgressController : ControllerBase
{
    private readonly ILearningProgressService _service;
    private readonly ICurrentUserService _currentUser;

    public LearningProgressController(
        ILearningProgressService service,
        ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Học viên tự cập nhật tiến độ học (upsert).
    /// Chỉ Student, chỉ với course/material của chính mình.
    /// </summary>
    [Authorize(Roles = "Student")]
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<LearningProgressResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProgress([FromBody] UpdateLearningProgressRequest request)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue)
            return Unauthorized(ApiResponse<object>.FailureResult("Người dùng chưa xác thực."));

        var result = await _service.UpdateProgressAsync(userId.Value, request);
        if (!result.Success)
        {
            if (result.Message!.Contains("quyền")) return StatusCode(StatusCodes.Status403Forbidden, result);
            if (result.Message.Contains("tìm thấy")) return NotFound(result);
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Học viên xem tiến độ học của bản thân (có filter theo courseId).
    /// </summary>
    [Authorize(Roles = "Student")]
    [HttpGet("my")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<LearningProgressResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyProgress([FromQuery] LearningProgressFilterRequest filter)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue)
            return Unauthorized(ApiResponse<object>.FailureResult("Người dùng chưa xác thực."));

        var result = await _service.GetMyProgressAsync(userId.Value, filter);
        return Ok(result);
    }
}

// Note: GET /api/v1/courses/{courseId}/progress được đặt trong CoursesController
// để giữ resource hierarchy đúng RESTful: courses/{id}/progress.
