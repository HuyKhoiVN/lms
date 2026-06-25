using lms.Domain.Common;

namespace lms.Domain.Entities;

public class AnswerOption : AuditableEntity
{
    public int QuestionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int Order { get; set; }
}
