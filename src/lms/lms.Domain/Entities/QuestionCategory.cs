using lms.Domain.Common;

namespace lms.Domain.Entities;

public class QuestionCategory : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentCategoryId { get; set; }
}
