using lms.Domain.Common;

namespace lms.Domain.Entities;

public class GroupCourseAssignment : BaseEntity
{
    public int GroupId { get; set; }
    public int CourseId { get; set; }
}
