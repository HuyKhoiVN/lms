using lms.Domain.Common;

namespace lms.Domain.Entities;

public class Course : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public bool IsPublished { get; set; }
    public string? ThumbnailFileKey { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? ThumbnailContentType { get; set; }
    public string? ThumbnailOriginalFileName { get; set; }
}
