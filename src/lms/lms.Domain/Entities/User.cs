using System;
using lms.Domain.Common;

namespace lms.Domain.Entities;

public class User : AuditableEntity
{
    public string UserName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PasswordHash { get; set; }
    public string? FullName { get; set; }
    public bool IsLocked { get; set; }
    public DateTime? LastLoginDate { get; set; }
}
