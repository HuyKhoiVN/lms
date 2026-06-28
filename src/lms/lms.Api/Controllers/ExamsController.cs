using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Exams;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

/// <summary>
/// Quản lý bài thi — Admin CRUD/publish, Student xem danh sách được assign.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 8.
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/exams")]
public class ExamsController : ControllerBase
{
    private readonly IExamService _svc;
    private readonly IExamAssignmentService _assignSvc;
    private readonly ICurrentUserService _currentUser;

    public ExamsController(IExamService svc, IExamAssignmentService assignSvc, ICurrentUserService currentUser)
    {
        _svc = svc;
        _assignSvc = assignSvc;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ExamListItemResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged([FromQuery] ExamFilterRequest filter)
    {
        var role = _currentUser.Role;
        int? studentId = role == "Student" ? _currentUser.UserId : null;
        return Ok(await _svc.GetPagedAsync(filter, studentId));
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<ExamDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await _svc.GetByIdAsync(id);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ExamDetailResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateExamRequest request)
    {
        var r = await _svc.CreateAsync(request, _currentUser.UserId);
        if (!r.Success) return BadRequest(r);
        return CreatedAtAction(nameof(GetById), new { id = r.Data!.Id }, r);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<ExamDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateExamRequest request)
    {
        var r = await _svc.UpdateAsync(id, request, _currentUser.UserId);
        if (!r.Success) return r.Message!.Contains("tìm thấy") ? NotFound(r) : BadRequest(r);
        return Ok(r);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var r = await _svc.DeleteAsync(id, _currentUser.UserId);
        if (!r.Success) return r.Message!.Contains("tìm thấy") ? NotFound(r) : BadRequest(r);
        return NoContent();
    }

    /// <summary>Thêm câu hỏi manual vào bài thi (Admin).</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/questions")]
    [ProducesResponseType(typeof(ApiResponse<ExamDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AddQuestion(int id, [FromBody] AddExamQuestionRequest request)
    {
        var r = await _svc.AddQuestionAsync(id, request, _currentUser.UserId);
        if (!r.Success)
        {
            if (r.Message!.Contains("tìm thấy")) return NotFound(r);
            if (r.Message.Contains("đã có")) return Conflict(r);
            return BadRequest(r);
        }
        return Ok(r);
    }

    /// <summary>Xóa câu hỏi khỏi bài thi (Admin). Trả 204.</summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}/questions/{questionId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveQuestion(int id, int questionId)
    {
        var r = await _svc.RemoveQuestionAsync(id, questionId, _currentUser.UserId);
        if (!r.Success) return r.Message!.Contains("tìm thấy") ? NotFound(r) : BadRequest(r);
        return NoContent();
    }

    /// <summary>Lưu random rules (replace strategy). Admin only.</summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/random-rules")]
    [ProducesResponseType(typeof(ApiResponse<ExamDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SaveRandomRules(int id, [FromBody] SaveExamRandomRulesRequest request)
    {
        var r = await _svc.SaveRandomRulesAsync(id, request, _currentUser.UserId);
        if (!r.Success) return r.Message!.Contains("tìm thấy") ? NotFound(r) : BadRequest(r);
        return Ok(r);
    }

    /// <summary>Publish bài thi. Admin only.</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/publish")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Publish(int id)
    {
        var r = await _svc.PublishAsync(id, publish: true, _currentUser.UserId);
        if (!r.Success)
        {
            if (r.Message!.Contains("tìm thấy")) return NotFound(r);
            return StatusCode(StatusCodes.Status422UnprocessableEntity, r);
        }
        return Ok(r);
    }

    /// <summary>Unpublish bài thi. Admin only.</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/unpublish")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Unpublish(int id)
    {
        var r = await _svc.PublishAsync(id, publish: false, _currentUser.UserId);
        if (!r.Success) return r.Message!.Contains("tìm thấy") ? NotFound(r) : BadRequest(r);
        return Ok(r);
    }

    /// <summary>Assign exam cho users/groups. Admin only.</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/assign")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Assign(int id, [FromBody] AssignExamRequest request)
    {
        var r = await _assignSvc.AssignExamAsync(id, request, _currentUser.UserId);
        if (!r.Success) return r.Message!.Contains("tìm thấy") ? NotFound(r) : BadRequest(r);
        return Ok(r);
    }
}

/// <summary>
/// Exam assignments management — Admin only.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 9.
/// </summary>
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/exam-assignments")]
public class ExamAssignmentsController : ControllerBase
{
    private readonly IExamAssignmentService _svc;
    private readonly ICurrentUserService _currentUser;

    public ExamAssignmentsController(IExamAssignmentService svc, ICurrentUserService currentUser)
    {
        _svc = svc;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ExamAssignmentResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAssignments([FromQuery] ExamAssignmentFilterRequest filter)
    {
        var r = await _svc.GetAssignmentsAsync(filter);
        return r.Success ? Ok(r) : BadRequest(r);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveUserAssignment(int id)
    {
        var r = await _svc.RemoveUserAssignmentAsync(id, _currentUser.UserId);
        if (!r.Success) return r.Message!.Contains("tìm thấy") ? NotFound(r) : BadRequest(r);
        return NoContent();
    }
}

/// <summary>
/// Group exam assignments management — Admin only.
/// </summary>
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/group-exam-assignments")]
public class GroupExamAssignmentsController : ControllerBase
{
    private readonly IExamAssignmentService _svc;
    private readonly ICurrentUserService _currentUser;

    public GroupExamAssignmentsController(IExamAssignmentService svc, ICurrentUserService currentUser)
    {
        _svc = svc;
        _currentUser = currentUser;
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveGroupAssignment(int id)
    {
        var r = await _svc.RemoveGroupAssignmentAsync(id, _currentUser.UserId);
        if (!r.Success) return r.Message!.Contains("tìm thấy") ? NotFound(r) : BadRequest(r);
        return NoContent();
    }
}
