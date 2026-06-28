using System;
using System.Linq;
using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Identity;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IPasswordHasherService _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IAuditLogService _auditLogService;

    public AuthService(
        IUserRepository userRepository,
        IUserRoleRepository userRoleRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IPasswordHasherService passwordHasher,
        ITokenService tokenService,
        IAuditLogService auditLogService)
    {
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _auditLogService = auditLogService;
    }

    public async Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Password))
        {
            return ApiResponse<LoginResponse>.FailureResult("Tên đăng nhập và mật khẩu không được trống.");
        }

        var user = await _userRepository.GetByUserNameAsync(request.UserName);
        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash ?? string.Empty))
        {
            await _auditLogService.LogActionAsync(
                null, 
                "LOGIN_FAILED", 
                "User", 
                null, 
                null, 
                $"Đăng nhập thất bại: Tên tài khoản '{request.UserName}' hoặc mật khẩu sai."
            );
            return ApiResponse<LoginResponse>.FailureResult("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        if (user.IsLocked)
        {
            await _auditLogService.LogActionAsync(
                user.Id, 
                "LOGIN_LOCKED", 
                "User", 
                user.Id, 
                null, 
                "Tài khoản bị khóa đăng nhập."
            );
            return ApiResponse<LoginResponse>.FailureResult("Tài khoản của bạn đã bị khóa.");
        }

        var roles = await _userRoleRepository.GetRolesByUserIdAsync(user.Id);
        var primaryRole = roles.FirstOrDefault() ?? "Student";

        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var refreshTokenValue = _tokenService.GenerateRefreshToken();

        // Lưu Refresh Token
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            Expires = DateTime.UtcNow.AddDays(7),
            Created = DateTime.UtcNow
        };
        await _refreshTokenRepository.AddAsync(refreshToken);

        // Cập nhật LastLoginDate
        user.LastLoginDate = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);

        // Ghi Audit
        await _auditLogService.LogActionAsync(
            user.Id, 
            "LOGIN", 
            "User", 
            user.Id, 
            null, 
            "Đăng nhập hệ thống thành công."
        );

        var response = new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenValue,
            User = new UserAuthDto
            {
                Id = user.Id,
                UserName = user.UserName,
                FullName = user.FullName ?? string.Empty,
                Role = primaryRole
            }
        };

        return ApiResponse<LoginResponse>.SuccessResult(response, "Đăng nhập thành công.");
    }

    public async Task<ApiResponse<LoginResponse>> RefreshTokenAsync(RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return ApiResponse<LoginResponse>.FailureResult("Refresh Token không hợp lệ.");
        }

        var token = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken);
        if (token == null || !token.IsActive)
        {
            return ApiResponse<LoginResponse>.FailureResult("Refresh Token đã hết hạn hoặc không tồn tại.");
        }

        var user = await _userRepository.GetByIdAsync(token.UserId);
        if (user == null || user.IsLocked)
        {
            return ApiResponse<LoginResponse>.FailureResult("Người dùng không khả dụng hoặc bị khóa.");
        }

        // Revoke token cũ
        token.Revoked = DateTime.UtcNow;
        var newRefreshTokenValue = _tokenService.GenerateRefreshToken();
        token.ReplacedByToken = newRefreshTokenValue;
        await _refreshTokenRepository.UpdateAsync(token);

        // Tạo token mới
        var roles = await _userRoleRepository.GetRolesByUserIdAsync(user.Id);
        var primaryRole = roles.FirstOrDefault() ?? "Student";

        var newAccessToken = _tokenService.GenerateAccessToken(user, roles);
        var newRefreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = newRefreshTokenValue,
            Expires = DateTime.UtcNow.AddDays(7),
            Created = DateTime.UtcNow
        };
        await _refreshTokenRepository.AddAsync(newRefreshToken);

        var response = new LoginResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshTokenValue,
            User = new UserAuthDto
            {
                Id = user.Id,
                UserName = user.UserName,
                FullName = user.FullName ?? string.Empty,
                Role = primaryRole
            }
        };

        return ApiResponse<LoginResponse>.SuccessResult(response, "Làm mới Token thành công.");
    }

    public async Task<ApiResponse<object>> LogoutAsync(LogoutRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            var token = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken);
            if (token != null && token.IsActive)
            {
                token.Revoked = DateTime.UtcNow;
                await _refreshTokenRepository.UpdateAsync(token);

                await _auditLogService.LogActionAsync(
                    token.UserId, 
                    "LOGOUT", 
                    "User", 
                    token.UserId, 
                    null, 
                    "Đăng xuất hệ thống thành công."
                );
            }
        }

        return ApiResponse<object>.SuccessResult(null!, "Đăng xuất thành công.");
    }

    public async Task<ApiResponse<object>> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.OldPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return ApiResponse<object>.FailureResult("Mật khẩu cũ và mật khẩu mới không được để trống.");
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return ApiResponse<object>.FailureResult("Không tìm thấy người dùng.");
        }

        if (!_passwordHasher.VerifyPassword(request.OldPassword, user.PasswordHash ?? string.Empty))
        {
            return ApiResponse<object>.FailureResult("Mật khẩu cũ không chính xác.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.UpdateDate = DateTime.UtcNow;
        user.UpdatedBy = userId;
        await _userRepository.UpdateAsync(user);

        await _auditLogService.LogActionAsync(
            user.Id, 
            "CHANGE_PASSWORD", 
            "User", 
            user.Id, 
            null, 
            "Người dùng tự đổi mật khẩu thành công."
        );

        return ApiResponse<object>.SuccessResult(null!, "Thay đổi mật khẩu thành công.");
    }
}
