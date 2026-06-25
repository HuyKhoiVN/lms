using lms.Domain.Common;

namespace lms.Domain.Entities;

public class AuditLog : AuditableEntity
{
    public int? UserId { get; set; }
    public string? Action { get; set; }
    public string? EntityName { get; set; }
    public int? EntityId { get; set; }
    public string? BeforeData { get; set; }
    public string? AfterData { get; set; }
}
