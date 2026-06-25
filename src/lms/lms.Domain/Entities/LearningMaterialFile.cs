using lms.Domain.Common;

namespace lms.Domain.Entities;

public class LearningMaterialFile : BaseEntity
{
    public int LearningMaterialId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? ContentType { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string? StorageProvider { get; set; }
}
