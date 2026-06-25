using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class ExamResultDetailConfiguration : IEntityTypeConfiguration<ExamResultDetail>
{
    public void Configure(EntityTypeBuilder<ExamResultDetail> builder)
    {
        builder.ToTable("ExamResultDetails");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ExamResultId).IsRequired();
        builder.Property(x => x.QuestionId).IsRequired();
        builder.Property(x => x.IsCorrect).IsRequired();
        builder.Property(x => x.ScoreEarned).IsRequired().HasColumnType("decimal(18,2)");

        builder.HasIndex(x => x.ExamResultId);
        builder.HasIndex(x => x.QuestionId);
        builder.HasIndex(x => new { x.ExamResultId, x.QuestionId }).IsUnique();
    }
}
