using System;
using lms.Domain.Common;

namespace lms.Domain.Entities;

public class ExamAssignment : BaseEntity
{
    public int ExamId { get; set; }
    public int UserId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
