using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Results;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

/// <summary>
/// Kết quả thi — Student xem result/review của mình, Admin xem tất cả.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 12.
/// ReviewMode enforcement: NoReview/ResultOnly/AnswerOnly/FullReview.
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/results")]
public class ResultsController : ControllerBase
{
    private readonly IResultService _svc;
    private readonly ICurrentUserService _currentUser;

    public ResultsController(IResultService svc, ICurrentUserService currentUser)
    {
        _svc = svc;
        _currentUser = currentUser;
    }

    /// <summary>Kết quả của tôi (Student).</summary>
    [HttpGet("my")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ResultListItemResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyResults([FromQuery] MyResultFilterRequest filter)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.FailureResult("Chưa xác thực."));
        return Ok(await _svc.GetMyResultsAsync(userId.Value, filter));
    }

    /// <summary>Admin query tất cả results.</summary>
    [Authorize(Roles = "Admin")]
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ResultListItemResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] ResultFilterRequest filter)
    {
        return Ok(await _svc.GetAllResultsAsync(filter));
    }

    /// <summary>Chi tiết result (owner hoặc Admin).</summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<ResultDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = _currentUser.UserId;
        var isAdmin = _currentUser.Role == "Admin";
        var r = await _svc.GetByIdAsync(id, userId, isAdmin);
        if (!r.Success)
        {
            if (r.Message!.Contains("quyền")) return StatusCode(StatusCodes.Status403Forbidden, r);
            return NotFound(r);
        }
        return Ok(r);
    }

    /// <summary>
    /// Review attempt (theo ReviewMode).
    /// NoReview → 403/400. ResultOnly → chỉ score. AnswerOnly → selected answers. FullReview → đầy đủ.
    /// </summary>
    [HttpGet("{id}/review")]
    [ProducesResponseType(typeof(ApiResponse<ResultReviewResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReview(int id)
    {
        var userId = _currentUser.UserId;
        var isAdmin = _currentUser.Role == "Admin";
        var r = await _svc.GetReviewAsync(id, userId, isAdmin);
        if (!r.Success)
        {
            if (r.Message!.Contains("quyền") || r.Message.Contains("hỗ trợ"))
                return StatusCode(StatusCodes.Status403Forbidden, r);
            return NotFound(r);
        }
        return Ok(r);
    }
}
