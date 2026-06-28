using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.ExamAttempts;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

/// <summary>
/// Exam runtime: start → autosave → submit.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 10.
/// IsCorrect KHÔNG bao giờ trả về trước submit/review hợp lệ.
/// </summary>
[Authorize(Roles = "Student")]
[ApiController]
[Route("api/v1/exam-attempts")]
public class ExamAttemptsController : ControllerBase
{
    private readonly IExamAttemptService _svc;
    private readonly ICurrentUserService _currentUser;

    public ExamAttemptsController(IExamAttemptService svc, ICurrentUserService currentUser)
    {
        _svc = svc;
        _currentUser = currentUser;
    }

    /// <summary>Bắt đầu bài thi — tạo attempt + snapshot.</summary>
    [HttpPost("start")]
    [ProducesResponseType(typeof(ApiResponse<StartExamResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Start([FromBody] StartExamRequest request)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.FailureResult("Chưa xác thực."));

        var r = await _svc.StartExamAsync(userId.Value, request);
        if (!r.Success)
        {
            if (r.Message!.Contains("quyền")) return StatusCode(StatusCodes.Status403Forbidden, r);
            if (r.Message.Contains("tìm thấy") || r.Message.Contains("publish")) return NotFound(r);
            if (r.Message.Contains("hết lượt")) return Conflict(r);
            return BadRequest(r);
        }
        return Ok(r);
    }

    /// <summary>Lấy attempt đang thi (bao gồm questions + saved answers).</summary>
    [HttpGet("{attemptId}")]
    [ProducesResponseType(typeof(ApiResponse<ExamAttemptTakingResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetActive(int attemptId)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.FailureResult("Chưa xác thực."));

        var r = await _svc.GetActiveAttemptAsync(userId.Value, attemptId);
        if (!r.Success)
        {
            if (r.Message!.Contains("kết thúc")) return Conflict(r);
            return NotFound(r);
        }
        return Ok(r);
    }

    /// <summary>Lưu tự động đáp án đang chọn.</summary>
    [HttpPost("{attemptId}/autosave")]
    [ProducesResponseType(typeof(ApiResponse<AutosaveAttemptResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Autosave(int attemptId, [FromBody] AutosaveAttemptRequest request)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.FailureResult("Chưa xác thực."));

        var r = await _svc.AutosaveAsync(userId.Value, attemptId, request);
        if (!r.Success)
        {
            if (r.Message!.Contains("kết thúc")) return Conflict(r);
            if (r.Message.Contains("tìm thấy")) return NotFound(r);
            return BadRequest(r);
        }
        return Ok(r);
    }

    /// <summary>Nộp bài thi. Idempotent: submit lần 2 trả result cũ.</summary>
    [HttpPost("{attemptId}/submit")]
    [ProducesResponseType(typeof(ApiResponse<SubmitAttemptResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Submit(int attemptId, [FromBody] SubmitAttemptRequest request)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.FailureResult("Chưa xác thực."));

        var r = await _svc.SubmitAsync(userId.Value, attemptId, request);
        if (!r.Success)
        {
            if (r.Message!.Contains("tìm thấy")) return NotFound(r);
            return BadRequest(r);
        }
        return Ok(r);
    }
}
