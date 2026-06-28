namespace lms.Application.Common.Exceptions;

/// <summary>
/// Thông tin xác thực không hợp lệ (sai mật khẩu, token hết hạn).
/// Map sang HTTP 401 Unauthorized.
/// </summary>
public sealed class UnauthorizedException : DomainException
{
    public UnauthorizedException(string message = "Bạn chưa xác thực hoặc thông tin đăng nhập không hợp lệ.")
        : base("UNAUTHORIZED", message)
    {
    }
}
