using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class ExamRandomRuleConfiguration : IEntityTypeConfiguration<ExamRandomRule>
{
    public void Configure(EntityTypeBuilder<ExamRandomRule> builder)
    {
        builder.ToTable("ExamRandomRules");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ExamId).IsRequired();
        builder.Property(x => x.Difficulty).HasMaxLength(50);
        builder.Property(x => x.QuestionCount).IsRequired();
        builder.Property(x => x.ScorePerQuestion).IsRequired().HasColumnType("decimal(18,2)");

        builder.HasIndex(x => x.ExamId);
        builder.HasIndex(x => x.CategoryId);
    }
}
