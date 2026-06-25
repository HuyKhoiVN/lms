using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class ExamAttemptConfiguration : IEntityTypeConfiguration<ExamAttempt>
{
    public void Configure(EntityTypeBuilder<ExamAttempt> builder)
    {
        builder.ToTable("ExamAttempts");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ExamId).IsRequired();
        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(50);
        builder.Property(x => x.Score).HasColumnType("decimal(18,2)");

        builder.HasIndex(x => x.ExamId);
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.StartedAt);
        builder.HasIndex(x => x.SubmittedAt);
    }
}
