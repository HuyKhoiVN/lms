using lms.Domain.Common;

namespace lms.Domain.Entities;

public class ExamResultDetail : BaseEntity
{
    public int ExamResultId { get; set; }
    public int QuestionId { get; set; }
    public bool IsCorrect { get; set; }
    public decimal ScoreEarned { get; set; }
}
