using lms.Domain.Common;

namespace lms.Domain.Entities;

public class LearningMaterialBlock : AuditableEntity
{
    public int LearningMaterialId { get; set; }
    public string BlockType { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public string? TextContent { get; set; }
    public string? Url { get; set; }
    public string? Caption { get; set; }
    public string? FileKey { get; set; }
    public string? OriginalFileName { get; set; }
    public string? ContentType { get; set; }
    public long? FileSize { get; set; }
    public string? StorageProvider { get; set; }
}
