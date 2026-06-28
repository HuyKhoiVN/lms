using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Identity;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserRepository _userRepo;
    private readonly IUserRoleRepository _userRoleRepo;

    public AuthController(
        IAuthService authService,
        ICurrentUserService currentUserService,
        IUserRepository userRepo,
        IUserRoleRepository userRoleRepo)
    {
        _authService = authService;
        _currentUserService = currentUserService;
        _userRepo = userRepo;
        _userRoleRepo = userRoleRepo;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (!result.Success)
        {
            if (result.Message != null && (result.Message.Contains("chính xác") || result.Message.Contains("không tồn tại")))
            {
                return Unauthorized(result);
            }
            if (result.Message != null && result.Message.Contains("khóa"))
            {
                return StatusCode(StatusCodes.Status423Locked, result);
            }
            return BadRequest(result);
        }
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var result = await _authService.RefreshTokenAsync(request);
        if (!result.Success)
        {
            return Unauthorized(result);
        }
        return Ok(result);
    }

    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        var result = await _authService.LogoutAsync(request);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("change-password")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            return Unauthorized(ApiResponse<object>.FailureResult("Người dùng chưa được xác thực."));
        }

        var result = await _authService.ChangePasswordAsync(userId.Value, request);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin user hiện tại từ JWT claims.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<CurrentUserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me()
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            return Unauthorized(ApiResponse<object>.FailureResult("Người dùng chưa được xác thực."));
        }

        var user = await _userRepo.GetByIdAsync(userId.Value);
        if (user is null)
        {
            return Unauthorized(ApiResponse<object>.FailureResult("Tài khoản không tồn tại."));
        }

        var roles = await _userRoleRepo.GetRolesByUserIdAsync(userId.Value);

        var response = new CurrentUserResponse
        {
            Id = user.Id,
            UserName = user.UserName,
            FullName = user.FullName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            Role = roles.Count > 0 ? roles[0] : string.Empty
        };

        return Ok(ApiResponse<CurrentUserResponse>.SuccessResult(response));
    }
}
