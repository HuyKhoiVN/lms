using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class ExamAssignmentConfiguration : IEntityTypeConfiguration<ExamAssignment>
{
    public void Configure(EntityTypeBuilder<ExamAssignment> builder)
    {
        builder.ToTable("ExamAssignments");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ExamId).IsRequired();
        builder.Property(x => x.UserId).IsRequired();

        builder.HasIndex(x => x.ExamId);
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => new { x.ExamId, x.UserId }).IsUnique();
    }
}
