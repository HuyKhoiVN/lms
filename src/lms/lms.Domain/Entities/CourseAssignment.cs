using lms.Domain.Common;

namespace lms.Domain.Entities;

public class CourseAssignment : BaseEntity
{
    public int CourseId { get; set; }
    public int UserId { get; set; }
}
