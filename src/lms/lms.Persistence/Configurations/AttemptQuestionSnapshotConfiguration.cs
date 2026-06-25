using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class AttemptQuestionSnapshotConfiguration : IEntityTypeConfiguration<AttemptQuestionSnapshot>
{
    public void Configure(EntityTypeBuilder<AttemptQuestionSnapshot> builder)
    {
        builder.ToTable("AttemptQuestionSnapshots");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.AttemptId).IsRequired();
        builder.Property(x => x.QuestionId).IsRequired();
        builder.Property(x => x.Content).IsRequired(); // defaults to nvarchar(max)
        builder.Property(x => x.QuestionType).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Score).IsRequired().HasColumnType("decimal(18,2)");
        builder.Property(x => x.Order).IsRequired();

        builder.HasIndex(x => x.AttemptId);
        builder.HasIndex(x => x.QuestionId);
        builder.HasIndex(x => new { x.AttemptId, x.QuestionId }).IsUnique();
    }
}
