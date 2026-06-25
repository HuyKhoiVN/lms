using System;
using lms.Domain.Common;

namespace lms.Domain.Entities;

public class GroupExamAssignment : BaseEntity
{
    public int ExamId { get; set; }
    public int GroupId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
