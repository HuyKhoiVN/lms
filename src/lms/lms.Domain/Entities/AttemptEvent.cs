using System;
using lms.Domain.Common;

namespace lms.Domain.Entities;

public class AttemptEvent : BaseEntity
{
    public int AttemptId { get; set; }
    public string EventType { get; set; } = string.Empty; // e.g. Start, SaveAnswer, TabFocusLost, Submit
    public string? EventData { get; set; }
    public DateTime CreatedDate { get; set; }
}
