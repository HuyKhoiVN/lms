using lms.Domain.Common;

namespace lms.Domain.Entities;

public class Group : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
