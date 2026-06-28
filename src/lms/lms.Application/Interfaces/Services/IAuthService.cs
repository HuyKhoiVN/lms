using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Identity;

namespace lms.Application.Interfaces.Services;

public interface IAuthService
{
    Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request);
    Task<ApiResponse<LoginResponse>> RefreshTokenAsync(RefreshTokenRequest request);
    Task<ApiResponse<object>> LogoutAsync(LogoutRequest request);
    Task<ApiResponse<object>> ChangePasswordAsync(int userId, ChangePasswordRequest request);
}
