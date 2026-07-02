using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Courses;
using lms.Application.DTOs.Exams;
using lms.Application.DTOs.LearningProgress;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/courses")]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;
    private readonly ICourseAssignmentService _courseAssignmentService;
    private readonly ICourseAccessService _courseAccessService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILearningProgressService _progressService;
    private readonly IExamAssignmentService _examAssignmentService;

    public CoursesController(
        ICourseService courseService,
        ICourseAssignmentService courseAssignmentService,
        ICourseAccessService courseAccessService,
        ICurrentUserService currentUserService,
        ILearningProgressService progressService,
        IExamAssignmentService examAssignmentService)
    {
        _courseService = courseService;
        _courseAssignmentService = courseAssignmentService;
        _courseAccessService = courseAccessService;
        _currentUserService = currentUserService;
        _progressService = progressService;
        _examAssignmentService = examAssignmentService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CourseListItemResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged([FromQuery] CourseFilterRequest filter)
    {
        var role = _currentUserService.Role;
        int? studentId = null;

        if (role == "Student")
        {
            studentId = _currentUserService.UserId;
        }

        var result = await _courseService.GetPagedAsync(filter, studentId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CourseDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var role = _currentUserService.Role;
        if (role == "Student")
        {
            var studentId = _currentUserService.UserId;
            if (!studentId.HasValue || !await _courseAccessService.HasAccessAsync(studentId.Value, id))
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.FailureResult("Bạn không có quyền truy cập khóa học này."));
            }
        }

        var result = await _courseService.GetByIdAsync(id);
        if (!result.Success)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CourseDetailResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateCourseRequest request)
    {
        var adminId = _currentUserService.UserId;
        var result = await _courseService.CreateCourseAsync(request, adminId);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CourseDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCourseRequest request)
    {
        var adminId = _currentUserService.UserId;
        var result = await _courseService.UpdateCourseAsync(id, request, adminId);
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("Không tìm thấy"))
            {
                return NotFound(result);
            }
            return BadRequest(result);
        }
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var adminId = _currentUserService.UserId;
        var result = await _courseService.DeleteCourseAsync(id, adminId);
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("Không tìm thấy"))
            {
                return NotFound(result);
            }
            return BadRequest(result);
        }
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/assign")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Assign(int id, [FromBody] AssignCourseRequest request)
    {
        var adminId = _currentUserService.UserId;
        var result = await _courseAssignmentService.AssignCourseAsync(id, request, adminId);
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("Không tìm thấy"))
            {
                return NotFound(result);
            }
            return BadRequest(result);
        }
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}/assignments/{assignmentId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveAssignment(int id, int assignmentId)
    {
        var adminId = _currentUserService.UserId;
        var result = await _courseAssignmentService.RemoveAssignmentAsync(assignmentId, adminId);
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("Không tìm thấy"))
            {
                return NotFound(result);
            }
            return BadRequest(result);
        }
        return NoContent();
    }

    /// <summary>
    /// Publish course (Admin only).
    /// Spec: POST /api/v1/courses/{id}/publish → 200.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/publish")]
    [ProducesResponseType(typeof(ApiResponse<CourseDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Publish(int id)
    {
        var adminId = _currentUserService.UserId;
        var result = await _courseService.PublishCourseAsync(id, published: true, adminId);
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("Không tìm thấy"))
            {
                return NotFound(result);
            }
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Unpublish course (Admin only).
    /// Spec: POST /api/v1/courses/{id}/unpublish → 200.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/unpublish")]
    [ProducesResponseType(typeof(ApiResponse<CourseDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Unpublish(int id)
    {
        var adminId = _currentUserService.UserId;
        var result = await _courseService.PublishCourseAsync(id, published: false, adminId);
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("Không tìm thấy"))
            {
                return NotFound(result);
            }
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>Thêm bài thi vào course (Admin). Trả 200 + CourseExamResponse.</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("{courseId}/exams")]
    [ProducesResponseType(typeof(ApiResponse<CourseExamResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddCourseExam(int courseId, [FromBody] AddCourseExamRequest request)
    {
        var r = await _examAssignmentService.AddCourseExamAsync(courseId, request, _currentUserService.UserId);
        if (!r.Success) return r.Message!.Contains("tìm thấy") ? NotFound(r) : BadRequest(r);
        return Ok(r);
    }

    /// <summary>Đọc danh sách bài thi gắn với course.</summary>
    [HttpGet("{courseId}/exams")]
    [ProducesResponseType(typeof(ApiResponse<List<CourseExamResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCourseExams(int courseId)
    {
        var role = _currentUserService.Role;
        if (role == "Student")
        {
            var studentId = _currentUserService.UserId;
            if (!studentId.HasValue || !await _courseAccessService.HasAccessAsync(studentId.Value, courseId))
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.FailureResult("Bạn không có quyền truy cập khóa học này."));
            }
        }

        var r = await _examAssignmentService.GetCourseExamsAsync(courseId);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{courseId}/exams/{examId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveCourseExam(int courseId, int examId)
    {
        var r = await _examAssignmentService.RemoveCourseExamAsync(courseId, examId, _currentUserService.UserId);
        if (!r.Success) return r.Message!.Contains("tìm thấy") ? NotFound(r) : BadRequest(r);
        return NoContent();
    }

    /// <summary>Course progress summary — Admin xem tất cả, Student chỉ xem của mình.</summary>
    [HttpGet("{courseId}/progress")]
    [ProducesResponseType(typeof(ApiResponse<CourseProgressSummaryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProgress(int courseId)
    {
        var role = _currentUserService.Role;
        var userId = _currentUserService.UserId;
        bool isAdmin = role == "Admin";

        var result = await _progressService.GetCourseProgressSummaryAsync(courseId, userId, isAdmin);
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("quyền"))
                return StatusCode(StatusCodes.Status403Forbidden, result);
            return NotFound(result);
        }
        return Ok(result);
    }
}
