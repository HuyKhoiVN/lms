using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Users;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUserService;

    public UsersController(IUserService userService, ICurrentUserService currentUserService)
    {
        _userService = userService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<UserListItemResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged([FromQuery] UserFilterRequest filter)
    {
        var result = await _userService.GetPagedAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<UserDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _userService.GetByIdAsync(id);
        if (!result.Success)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<UserDetailResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var adminId = _currentUserService.UserId;
        var result = await _userService.CreateUserAsync(request, adminId);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<UserDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        var adminId = _currentUserService.UserId;
        var result = await _userService.UpdateUserAsync(id, request, adminId);
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

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var adminId = _currentUserService.UserId;
        var result = await _userService.DeleteUserAsync(id, adminId);
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

    [HttpPost("{id}/lock")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Lock(int id, [FromBody] LockUserRequest request)
    {
        var adminId = _currentUserService.UserId;
        var result = await _userService.LockUserAsync(id, request.Reason, adminId);
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

    [HttpPost("{id}/unlock")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Unlock(int id)
    {
        var adminId = _currentUserService.UserId;
        var result = await _userService.UnlockUserAsync(id, adminId);
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

    [HttpPost("{id}/reset-password")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest request)
    {
        var adminId = _currentUserService.UserId;
        var result = await _userService.ResetPasswordAsync(id, request, adminId);
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
}
