using System;
using lms.Domain.Common;

namespace lms.Domain.Entities;

public class ExamAttempt : AuditableEntity
{
    public int ExamId { get; set; }
    public int UserId { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Status { get; set; } // e.g. InProgress, Submitted, AutoSubmitted
    public decimal? Score { get; set; }
    public bool? Passed { get; set; }
}
