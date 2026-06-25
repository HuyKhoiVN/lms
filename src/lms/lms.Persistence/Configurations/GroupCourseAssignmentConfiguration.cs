using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class GroupCourseAssignmentConfiguration : IEntityTypeConfiguration<GroupCourseAssignment>
{
    public void Configure(EntityTypeBuilder<GroupCourseAssignment> builder)
    {
        builder.ToTable("GroupCourseAssignments");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.GroupId).IsRequired();
        builder.Property(x => x.CourseId).IsRequired();

        builder.HasIndex(x => x.GroupId);
        builder.HasIndex(x => x.CourseId);
        builder.HasIndex(x => new { x.GroupId, x.CourseId }).IsUnique();
    }
}
