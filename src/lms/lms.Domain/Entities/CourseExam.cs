using lms.Domain.Common;

namespace lms.Domain.Entities;

public class CourseExam : BaseEntity
{
    public int CourseId { get; set; }
    public int ExamId { get; set; }
    public int Order { get; set; }
}
