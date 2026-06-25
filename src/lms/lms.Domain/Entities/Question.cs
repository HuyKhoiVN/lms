using lms.Domain.Common;

namespace lms.Domain.Entities;

public class Question : AuditableEntity
{
    public int CategoryId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty; // e.g. SingleChoice, MultipleChoice
    public string Difficulty { get; set; } = string.Empty; // e.g. Easy, Medium, Hard
    public int Order { get; set; }
}
