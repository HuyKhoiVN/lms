using lms.Domain.Common;

namespace lms.Domain.Entities;

public class LearningMaterial : AuditableEntity
{
    public int CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty; // e.g. Text, PDF, File, Link
    public string? TextContent { get; set; }
    public string? ExternalLink { get; set; }
    public int Order { get; set; }
}
