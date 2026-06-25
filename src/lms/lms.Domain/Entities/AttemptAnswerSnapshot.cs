using lms.Domain.Common;

namespace lms.Domain.Entities;

public class AttemptAnswerSnapshot : BaseEntity
{
    public int AttemptId { get; set; }
    public int QuestionId { get; set; }
    public int AnswerOptionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int Order { get; set; }
}
