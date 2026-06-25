using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class ExamResultConfiguration : IEntityTypeConfiguration<ExamResult>
{
    public void Configure(EntityTypeBuilder<ExamResult> builder)
    {
        builder.ToTable("ExamResults");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.AttemptId).IsRequired();
        builder.Property(x => x.ExamId).IsRequired();
        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Score).IsRequired().HasColumnType("decimal(18,2)");
        builder.Property(x => x.Passed).IsRequired();
        builder.Property(x => x.CompletedDate).IsRequired();

        builder.HasIndex(x => x.AttemptId).IsUnique();
        builder.HasIndex(x => x.ExamId);
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.CompletedDate);
    }
}
