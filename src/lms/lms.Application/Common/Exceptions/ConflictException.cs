namespace lms.Application.Common.Exceptions;

/// <summary>
/// State conflict: duplicate unique field, soft delete khi đang có dependency,
/// publish khi đã có attempt, vv.
/// Map sang HTTP 409 Conflict.
/// </summary>
public sealed class ConflictException : DomainException
{
    public ConflictException(string message)
        : base("CONFLICT", message)
    {
    }

    public ConflictException(string errorCode, string message)
        : base(errorCode, message)
    {
    }
}
