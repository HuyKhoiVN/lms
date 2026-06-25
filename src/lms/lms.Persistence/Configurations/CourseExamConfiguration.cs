using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class CourseExamConfiguration : IEntityTypeConfiguration<CourseExam>
{
    public void Configure(EntityTypeBuilder<CourseExam> builder)
    {
        builder.ToTable("CourseExams");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CourseId).IsRequired();
        builder.Property(x => x.ExamId).IsRequired();
        builder.Property(x => x.Order).IsRequired();

        builder.HasIndex(x => x.CourseId);
        builder.HasIndex(x => x.ExamId);
        builder.HasIndex(x => new { x.CourseId, x.ExamId }).IsUnique();
    }
}
