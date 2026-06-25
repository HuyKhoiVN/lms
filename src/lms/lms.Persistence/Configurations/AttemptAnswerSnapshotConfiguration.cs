using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class AttemptAnswerSnapshotConfiguration : IEntityTypeConfiguration<AttemptAnswerSnapshot>
{
    public void Configure(EntityTypeBuilder<AttemptAnswerSnapshot> builder)
    {
        builder.ToTable("AttemptAnswerSnapshots");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.AttemptId).IsRequired();
        builder.Property(x => x.QuestionId).IsRequired();
        builder.Property(x => x.AnswerOptionId).IsRequired();
        builder.Property(x => x.Content).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.IsCorrect).IsRequired();
        builder.Property(x => x.Order).IsRequired();

        builder.HasIndex(x => x.AttemptId);
        builder.HasIndex(x => x.QuestionId);
        builder.HasIndex(x => x.AnswerOptionId);
        builder.HasIndex(x => new { x.AttemptId, x.AnswerOptionId }).IsUnique();
    }
}
