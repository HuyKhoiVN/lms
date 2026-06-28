using System.Collections.Generic;

namespace lms.Application.Common.Exceptions;

/// <summary>
/// Lỗi validation cấp request (FluentValidation hoặc service tự validate).
/// Map sang HTTP 400 Bad Request.
/// </summary>
public sealed class ValidationException : DomainException
{
    public ValidationException(string message, IEnumerable<string>? errors = null)
        : base("VALIDATION_FAILED", message, errors)
    {
    }

    public ValidationException(IEnumerable<string> errors)
        : base("VALIDATION_FAILED", "Validation failed", errors)
    {
    }
}
