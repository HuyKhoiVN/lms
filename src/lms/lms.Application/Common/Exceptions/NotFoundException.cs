namespace lms.Application.Common.Exceptions;

/// <summary>
/// Tài nguyên không tồn tại hoặc đã soft delete.
/// Map sang HTTP 404 Not Found.
/// </summary>
public sealed class NotFoundException : DomainException
{
    public NotFoundException(string entityName, object key)
        : base("NOT_FOUND", $"Không tìm thấy {entityName} với khóa '{key}'.")
    {
    }

    public NotFoundException(string message)
        : base("NOT_FOUND", message)
    {
    }
}
