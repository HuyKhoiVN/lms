using lms.Domain.Common;

namespace lms.Domain.Entities;

public class AttemptQuestionSnapshot : BaseEntity
{
    public int AttemptId { get; set; }
    public int QuestionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public int Order { get; set; }
}
