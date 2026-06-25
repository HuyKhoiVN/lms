using lms.Domain.Common;

namespace lms.Domain.Entities;

public class ExamRandomRule : AuditableEntity
{
    public int ExamId { get; set; }
    public int? CategoryId { get; set; }
    public string? Difficulty { get; set; }
    public int QuestionCount { get; set; }
    public decimal ScorePerQuestion { get; set; }
}
