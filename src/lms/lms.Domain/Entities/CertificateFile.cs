using lms.Domain.Common;

namespace lms.Domain.Entities;

public class CertificateFile : BaseEntity
{
    public int CertificateId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string StoragePath { get; set; } = string.Empty;
}
