using lms.Domain.Common;

namespace lms.Domain.Entities;

public class AttemptAnswer : BaseEntity
{
    public int AttemptId { get; set; }
    public int QuestionId { get; set; }
    public int AnswerOptionId { get; set; }
}
