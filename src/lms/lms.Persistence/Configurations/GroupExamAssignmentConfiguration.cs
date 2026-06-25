using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class GroupExamAssignmentConfiguration : IEntityTypeConfiguration<GroupExamAssignment>
{
    public void Configure(EntityTypeBuilder<GroupExamAssignment> builder)
    {
        builder.ToTable("GroupExamAssignments");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ExamId).IsRequired();
        builder.Property(x => x.GroupId).IsRequired();

        builder.HasIndex(x => x.ExamId);
        builder.HasIndex(x => x.GroupId);
        builder.HasIndex(x => new { x.ExamId, x.GroupId }).IsUnique();
    }
}
