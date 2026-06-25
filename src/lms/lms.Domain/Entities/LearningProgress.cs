using System;
using lms.Domain.Common;

namespace lms.Domain.Entities;

public class LearningProgress : AuditableEntity
{
    public int UserId { get; set; }
    public int CourseId { get; set; }
    public int LearningMaterialId { get; set; }
    public decimal ProgressPercent { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedDate { get; set; }
}
