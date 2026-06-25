using lms.Domain.Common;

namespace lms.Domain.Entities;

public class ExamQuestion : BaseEntity
{
    public int ExamId { get; set; }
    public int QuestionId { get; set; }
    public decimal Score { get; set; }
    public int Order { get; set; }
}
