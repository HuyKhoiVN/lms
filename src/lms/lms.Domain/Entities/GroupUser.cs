using lms.Domain.Common;

namespace lms.Domain.Entities;

public class GroupUser : BaseEntity
{
    public int GroupId { get; set; }
    public int UserId { get; set; }
}
