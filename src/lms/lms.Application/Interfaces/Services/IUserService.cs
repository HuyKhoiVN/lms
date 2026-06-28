using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Users;

namespace lms.Application.Interfaces.Services;

public interface IUserService
{
    Task<ApiResponse<UserDetailResponse>> CreateUserAsync(CreateUserRequest request, int? adminId);
    Task<ApiResponse<UserDetailResponse>> UpdateUserAsync(int id, UpdateUserRequest request, int? adminId);
    Task<ApiResponse<object>> DeleteUserAsync(int id, int? adminId);
    Task<ApiResponse<UserDetailResponse>> GetByIdAsync(int id);
    Task<ApiResponse<PagedResult<UserListItemResponse>>> GetPagedAsync(UserFilterRequest filter);
    Task<ApiResponse<object>> LockUserAsync(int id, string? reason, int? adminId);
    Task<ApiResponse<object>> UnlockUserAsync(int id, int? adminId);
    Task<ApiResponse<object>> ResetPasswordAsync(int id, ResetPasswordRequest request, int? adminId);
}
