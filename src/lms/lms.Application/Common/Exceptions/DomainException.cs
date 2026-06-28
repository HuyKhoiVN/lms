using System;
using System.Collections.Generic;

namespace lms.Application.Common.Exceptions;

/// <summary>
/// Base exception cho mọi lỗi nghiệp vụ trong tầng Application.
/// Controller KHÔNG bao giờ catch trực tiếp; middleware ExceptionHandlingMiddleware
/// sẽ map sang HTTP status + envelope ApiResponse theo loại exception.
/// </summary>
public abstract class DomainException : Exception
{
    /// <summary>
    /// Mã lỗi nghiệp vụ ngắn gọn để client/log đối chiếu, ví dụ "USER_NOT_FOUND".
    /// </summary>
    public string ErrorCode { get; }

    /// <summary>
    /// Danh sách chi tiết lỗi để serialize vào field "errors" của ApiResponse.
    /// </summary>
    public IReadOnlyList<string> Errors { get; }

    protected DomainException(string errorCode, string message, IEnumerable<string>? errors = null)
        : base(message)
    {
        ErrorCode = errorCode;
        Errors = errors is null ? Array.Empty<string>() : new List<string>(errors).AsReadOnly();
    }
}
