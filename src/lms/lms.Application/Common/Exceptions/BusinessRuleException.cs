namespace lms.Application.Common.Exceptions;

/// <summary>
/// Request đúng format nhưng vi phạm business rule
/// (ví dụ publish exam khi chưa có câu hỏi, change password sai chính sách).
/// Map sang HTTP 422 Unprocessable Entity.
/// </summary>
public sealed class BusinessRuleException : DomainException
{
    public BusinessRuleException(string message)
        : base("BUSINESS_RULE", message)
    {
    }

    public BusinessRuleException(string errorCode, string message)
        : base(errorCode, message)
    {
    }
}
