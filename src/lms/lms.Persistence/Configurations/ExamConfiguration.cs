using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class ExamConfiguration : IEntityTypeConfiguration<Exam>
{
    public void Configure(EntityTypeBuilder<Exam> builder)
    {
        builder.ToTable("Exams");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).IsRequired().HasMaxLength(255);
        builder.Property(x => x.Code).HasMaxLength(50);
        builder.Property(x => x.PassScore).IsRequired().HasColumnType("decimal(18,2)");
        builder.Property(x => x.ReviewMode).HasMaxLength(50);
        builder.Property(x => x.Description); // defaults to nvarchar(max)

        builder.HasIndex(x => x.Code);
        builder.HasIndex(x => x.IsPublished);
    }
}
