using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class AnswerOptionConfiguration : IEntityTypeConfiguration<AnswerOption>
{
    public void Configure(EntityTypeBuilder<AnswerOption> builder)
    {
        builder.ToTable("AnswerOptions");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.QuestionId).IsRequired();
        builder.Property(x => x.Content).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.IsCorrect).IsRequired();
        builder.Property(x => x.Order).IsRequired();

        builder.HasIndex(x => x.QuestionId);
        builder.HasIndex(x => x.IsCorrect);
    }
}
