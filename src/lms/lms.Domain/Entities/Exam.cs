using lms.Domain.Common;

namespace lms.Domain.Entities;

public class Exam : AuditableEntity
{
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public decimal PassScore { get; set; }
    public int? AttemptLimit { get; set; }
    public bool RandomQuestion { get; set; }
    public bool RandomAnswer { get; set; }
    public string? ReviewMode { get; set; } // e.g. FullReview, ResultOnly
    public bool ShowCorrectAnswers { get; set; }
    public bool ShowSelectedAnswers { get; set; }
    public bool ShowQuestionReview { get; set; }
    public bool IsPublished { get; set; }
}
