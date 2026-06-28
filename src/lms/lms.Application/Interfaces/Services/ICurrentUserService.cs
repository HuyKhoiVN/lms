namespace lms.Application.Interfaces.Services;

public interface ICurrentUserService
{
    int? UserId { get; }
    string? UserName { get; }
    string? Role { get; }
}
