using System;

namespace lms.Domain.Common;

public abstract class AuditableEntity : BaseEntity
{
    public DateTime? CreatedDate { get; set; }
    public DateTime? UpdateDate { get; set; }
    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
    public bool IsDelete { get; set; }
}
