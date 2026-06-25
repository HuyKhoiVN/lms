using lms.Domain.Common;

namespace lms.Domain.Entities;

public class FileRecord : AuditableEntity
{
    public string FileKey { get; set; } = string.Empty; // Unique key/token used publicly
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string? ContentType { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string? StorageProvider { get; set; }
    public string? Purpose { get; set; } // e.g. LearningMaterial, Certificate, ReportExport
}
