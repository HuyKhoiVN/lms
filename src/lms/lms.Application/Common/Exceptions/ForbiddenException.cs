namespace lms.Application.Common.Exceptions;

/// <summary>
/// Người dùng đã xác thực nhưng không đủ quyền với resource.
/// Map sang HTTP 403 Forbidden.
/// </summary>
public sealed class ForbiddenException : DomainException
{
    public ForbiddenException(string message = "Bạn không có quyền thực hiện thao tác này.")
        : base("FORBIDDEN", message)
    {
    }
}
