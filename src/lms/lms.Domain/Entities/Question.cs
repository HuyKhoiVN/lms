using lms.Domain.Common;

namespace lms.Domain.Entities;

public class Question : AuditableEntity
{
    public int CategoryId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty; // SingleChoice | MultipleChoice
    public string Difficulty { get; set; } = string.Empty;   // Easy | Medium | Hard
    public int Order { get; set; }

    /// <summary>
    /// Điểm mặc định của câu hỏi khi không có override ở ExamQuestion.
    /// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 7.
    /// </summary>
    public decimal Score { get; set; }
}
