using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Questions;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

/// <summary>
/// Ngân hàng câu hỏi — Admin only.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 7.
/// IsCorrect không lộ ra ngoài qua bất kỳ endpoint nào dành cho Student.
/// </summary>
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/question-categories")]
public class QuestionCategoriesController : ControllerBase
{
    private readonly IQuestionCategoryService _svc;
    private readonly ICurrentUserService _currentUser;

    public QuestionCategoriesController(IQuestionCategoryService svc, ICurrentUserService currentUser)
    {
        _svc = svc;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<QuestionCategoryResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged([FromQuery] QuestionCategoryFilterRequest filter)
        => Ok(await _svc.GetPagedAsync(filter));

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<QuestionCategoryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await _svc.GetByIdAsync(id);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<QuestionCategoryResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateQuestionCategoryRequest request)
    {
        var r = await _svc.CreateAsync(request, _currentUser.UserId);
        if (!r.Success) return BadRequest(r);
        return CreatedAtAction(nameof(GetById), new { id = r.Data!.Id }, r);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<QuestionCategoryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateQuestionCategoryRequest request)
    {
        var r = await _svc.UpdateAsync(id, request, _currentUser.UserId);
        if (!r.Success) return r.Message!.Contains("tìm thấy") ? NotFound(r) : BadRequest(r);
        return Ok(r);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id)
    {
        var r = await _svc.DeleteAsync(id, _currentUser.UserId);
        if (!r.Success)
        {
            if (r.Message!.Contains("tìm thấy")) return NotFound(r);
            return Conflict(r);
        }
        return NoContent();
    }
}

/// <summary>
/// Câu hỏi + đáp án — Admin only.
/// </summary>
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/questions")]
public class QuestionsController : ControllerBase
{
    private readonly IQuestionService _svc;
    private readonly ICurrentUserService _currentUser;

    public QuestionsController(IQuestionService svc, ICurrentUserService currentUser)
    {
        _svc = svc;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<QuestionListItemResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged([FromQuery] QuestionFilterRequest filter)
        => Ok(await _svc.GetPagedAsync(filter));

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<QuestionDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await _svc.GetByIdAsync(id);
        return r.Success ? Ok(r) : NotFound(r);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<QuestionDetailResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Create([FromBody] CreateQuestionRequest request)
    {
        var r = await _svc.CreateAsync(request, _currentUser.UserId);
        if (!r.Success) return r.Message!.Contains("tìm thấy") ? NotFound(r) : BadRequest(r);
        return CreatedAtAction(nameof(GetById), new { id = r.Data!.Id }, r);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<QuestionDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateQuestionRequest request)
    {
        var r = await _svc.UpdateAsync(id, request, _currentUser.UserId);
        if (!r.Success) return r.Message!.Contains("tìm thấy") ? NotFound(r) : BadRequest(r);
        return Ok(r);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var r = await _svc.DeleteAsync(id, _currentUser.UserId);
        if (!r.Success) return r.Message!.Contains("tìm thấy") ? NotFound(r) : BadRequest(r);
        return NoContent();
    }
}
