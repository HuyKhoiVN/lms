using System;
using lms.Domain.Common;

namespace lms.Domain.Entities;

public class Certificate : AuditableEntity
{
    public int UserId { get; set; }
    public int ExamId { get; set; }
    public string CertificateCode { get; set; } = string.Empty;
    public DateTime IssuedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
}
