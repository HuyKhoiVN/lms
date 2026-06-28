using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Users;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IUserRoleService _userRoleService;
    private readonly IPasswordHasherService _passwordHasher;
    private readonly IAuditLogService _auditLogService;

    public UserService(
        IUserRepository userRepository,
        IUserRoleRepository userRoleRepository,
        IUserRoleService userRoleService,
        IPasswordHasherService passwordHasher,
        IAuditLogService auditLogService)
    {
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _userRoleService = userRoleService;
        _passwordHasher = passwordHasher;
        _auditLogService = auditLogService;
    }

    public async Task<ApiResponse<UserDetailResponse>> CreateUserAsync(CreateUserRequest request, int? adminId)
    {
        if (string.IsNullOrWhiteSpace(request.UserName))
        {
            return ApiResponse<UserDetailResponse>.FailureResult("Tên đăng nhập không được để trống.");
        }

        var existingUser = await _userRepository.GetByUserNameAsync(request.UserName);
        if (existingUser != null)
        {
            return ApiResponse<UserDetailResponse>.FailureResult($"Tên đăng nhập '{request.UserName}' đã tồn tại.");
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var existingEmail = await _userRepository.GetByEmailAsync(request.Email);
            if (existingEmail != null)
            {
                return ApiResponse<UserDetailResponse>.FailureResult($"Địa chỉ Email '{request.Email}' đã được sử dụng.");
            }
        }

        var password = request.Password;
        if (string.IsNullOrWhiteSpace(password))
        {
            password = "123456"; // Mật khẩu mặc định
        }

        var user = new User
        {
            UserName = request.UserName,
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = _passwordHasher.HashPassword(password),
            IsLocked = false,
            IsDelete = false,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = adminId
        };

        await _userRepository.AddAsync(user);

        // Gán Role
        var roleName = string.IsNullOrWhiteSpace(request.Role) ? "Student" : request.Role;
        await _userRoleService.AssignRoleAsync(user.Id, roleName);

        // Ghi Audit Log
        await _auditLogService.LogActionAsync(
            adminId,
            "CREATE",
            "User",
            user.Id,
            null,
            $"{{\"UserName\":\"{user.UserName}\",\"FullName\":\"{user.FullName}\",\"Role\":\"{roleName}\"}}"
        );

        var response = new UserDetailResponse
        {
            Id = user.Id,
            UserName = user.UserName,
            FullName = user.FullName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            Role = roleName,
            IsLocked = user.IsLocked,
            LastLoginDate = user.LastLoginDate,
            CreatedDate = user.CreatedDate
        };

        return ApiResponse<UserDetailResponse>.SuccessResult(response, "Tạo người dùng thành công.");
    }

    public async Task<ApiResponse<UserDetailResponse>> UpdateUserAsync(int id, UpdateUserRequest request, int? adminId)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return ApiResponse<UserDetailResponse>.FailureResult("Không tìm thấy người dùng.");
        }

        if (!string.IsNullOrWhiteSpace(request.Email) && !string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase))
        {
            var existingEmail = await _userRepository.GetByEmailAsync(request.Email);
            if (existingEmail != null)
            {
                return ApiResponse<UserDetailResponse>.FailureResult($"Địa chỉ Email '{request.Email}' đã được sử dụng.");
            }
        }

        var beforeData = $"{{\"FullName\":\"{user.FullName}\",\"Email\":\"{user.Email}\"}}";

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.UpdateDate = DateTime.UtcNow;
        user.UpdatedBy = adminId;

        await _userRepository.UpdateAsync(user);

        // Cập nhật Role
        var roles = await _userRoleRepository.GetRolesByUserIdAsync(user.Id);
        var oldRole = roles.FirstOrDefault();
        var newRole = string.IsNullOrWhiteSpace(request.Role) ? "Student" : request.Role;
        
        if (oldRole != newRole)
        {
            if (!string.IsNullOrEmpty(oldRole))
            {
                await _userRoleService.RemoveRoleAsync(user.Id, oldRole);
            }
            await _userRoleService.AssignRoleAsync(user.Id, newRole);
        }

        await _auditLogService.LogActionAsync(
            adminId,
            "UPDATE",
            "User",
            user.Id,
            beforeData,
            $"{{\"FullName\":\"{user.FullName}\",\"Email\":\"{user.Email}\",\"Role\":\"{newRole}\"}}"
        );

        var response = new UserDetailResponse
        {
            Id = user.Id,
            UserName = user.UserName,
            FullName = user.FullName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            Role = newRole,
            IsLocked = user.IsLocked,
            LastLoginDate = user.LastLoginDate,
            CreatedDate = user.CreatedDate
        };

        return ApiResponse<UserDetailResponse>.SuccessResult(response, "Cập nhật người dùng thành công.");
    }

    public async Task<ApiResponse<object>> DeleteUserAsync(int id, int? adminId)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return ApiResponse<object>.FailureResult("Không tìm thấy người dùng.");
        }

        if (adminId.HasValue && user.Id == adminId.Value)
        {
            return ApiResponse<object>.FailureResult("Không thể tự xóa tài khoản của chính mình.");
        }

        user.IsDelete = true;
        user.UpdateDate = DateTime.UtcNow;
        user.UpdatedBy = adminId;

        await _userRepository.UpdateAsync(user);

        await _auditLogService.LogActionAsync(
            adminId,
            "DELETE",
            "User",
            user.Id,
            $"{{\"UserName\":\"{user.UserName}\"}}",
            null
        );

        return ApiResponse<object>.SuccessResult(null!, "Xóa người dùng thành công.");
    }

    public async Task<ApiResponse<UserDetailResponse>> GetByIdAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return ApiResponse<UserDetailResponse>.FailureResult("Không tìm thấy người dùng.");
        }

        var roles = await _userRoleRepository.GetRolesByUserIdAsync(user.Id);
        var role = roles.FirstOrDefault() ?? "Student";

        var response = new UserDetailResponse
        {
            Id = user.Id,
            UserName = user.UserName,
            FullName = user.FullName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            Role = role,
            IsLocked = user.IsLocked,
            LastLoginDate = user.LastLoginDate,
            CreatedDate = user.CreatedDate
        };

        return ApiResponse<UserDetailResponse>.SuccessResult(response);
    }

    public async Task<ApiResponse<PagedResult<UserListItemResponse>>> GetPagedAsync(UserFilterRequest filter)
    {
        var users = await _userRepository.GetPagedAsync(
            filter.Keyword,
            filter.Role,
            filter.IsLocked,
            filter.Page,
            filter.PageSize
        );

        var total = await _userRepository.GetCountAsync(
            filter.Keyword,
            filter.Role,
            filter.IsLocked
        );

        var items = new List<UserListItemResponse>();
        foreach (var u in users)
        {
            var roles = await _userRoleRepository.GetRolesByUserIdAsync(u.Id);
            items.Add(new UserListItemResponse
            {
                Id = u.Id,
                UserName = u.UserName,
                FullName = u.FullName ?? string.Empty,
                Email = u.Email ?? string.Empty,
                Role = roles.FirstOrDefault() ?? "Student",
                IsLocked = u.IsLocked
            });
        }

        var pagedResult = new PagedResult<UserListItemResponse>(items, total, filter.Page, filter.PageSize);
        return ApiResponse<PagedResult<UserListItemResponse>>.SuccessResult(pagedResult);
    }

    public async Task<ApiResponse<object>> LockUserAsync(int id, string? reason, int? adminId)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return ApiResponse<object>.FailureResult("Không tìm thấy người dùng.");
        }

        if (adminId.HasValue && user.Id == adminId.Value)
        {
            return ApiResponse<object>.FailureResult("Không thể tự khóa tài khoản của chính mình.");
        }

        user.IsLocked = true;
        user.UpdateDate = DateTime.UtcNow;
        user.UpdatedBy = adminId;

        await _userRepository.UpdateAsync(user);

        await _auditLogService.LogActionAsync(
            adminId,
            "LOCK",
            "User",
            user.Id,
            $"{{\"Reason\":\"{reason}\"}}",
            null
        );

        return ApiResponse<object>.SuccessResult(null!, "Khóa người dùng thành công.");
    }

    public async Task<ApiResponse<object>> UnlockUserAsync(int id, int? adminId)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return ApiResponse<object>.FailureResult("Không tìm thấy người dùng.");
        }

        user.IsLocked = false;
        user.UpdateDate = DateTime.UtcNow;
        user.UpdatedBy = adminId;

        await _userRepository.UpdateAsync(user);

        await _auditLogService.LogActionAsync(
            adminId,
            "UNLOCK",
            "User",
            user.Id,
            null,
            null
        );

        return ApiResponse<object>.SuccessResult(null!, "Mở khóa người dùng thành công.");
    }

    public async Task<ApiResponse<object>> ResetPasswordAsync(int id, ResetPasswordRequest request, int? adminId)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return ApiResponse<object>.FailureResult("Mật khẩu mới không được để trống.");
        }

        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return ApiResponse<object>.FailureResult("Không tìm thấy người dùng.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.UpdateDate = DateTime.UtcNow;
        user.UpdatedBy = adminId;

        await _userRepository.UpdateAsync(user);

        await _auditLogService.LogActionAsync(
            adminId,
            "RESET_PASSWORD",
            "User",
            user.Id,
            null,
            null
        );

        return ApiResponse<object>.SuccessResult(null!, "Khởi tạo lại mật khẩu thành công.");
    }
}
