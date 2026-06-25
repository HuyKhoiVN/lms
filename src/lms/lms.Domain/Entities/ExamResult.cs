using System;
using lms.Domain.Common;

namespace lms.Domain.Entities;

public class ExamResult : AuditableEntity
{
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public int UserId { get; set; }
    public decimal Score { get; set; }
    public bool Passed { get; set; }
    public DateTime CompletedDate { get; set; }
}
