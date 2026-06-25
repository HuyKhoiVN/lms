using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class ExamQuestionConfiguration : IEntityTypeConfiguration<ExamQuestion>
{
    public void Configure(EntityTypeBuilder<ExamQuestion> builder)
    {
        builder.ToTable("ExamQuestions");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ExamId).IsRequired();
        builder.Property(x => x.QuestionId).IsRequired();
        builder.Property(x => x.Score).IsRequired().HasColumnType("decimal(18,2)");
        builder.Property(x => x.Order).IsRequired();

        builder.HasIndex(x => x.ExamId);
        builder.HasIndex(x => x.QuestionId);
        builder.HasIndex(x => new { x.ExamId, x.QuestionId }).IsUnique();
    }
}
