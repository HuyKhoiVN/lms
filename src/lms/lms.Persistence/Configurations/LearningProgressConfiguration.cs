using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class LearningProgressConfiguration : IEntityTypeConfiguration<LearningProgress>
{
    public void Configure(EntityTypeBuilder<LearningProgress> builder)
    {
        builder.ToTable("LearningProgress");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.CourseId).IsRequired();
        builder.Property(x => x.LearningMaterialId).IsRequired();
        builder.Property(x => x.ProgressPercent).IsRequired().HasColumnType("decimal(18,2)");
        builder.Property(x => x.IsCompleted).IsRequired();

        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.CourseId);
        builder.HasIndex(x => x.LearningMaterialId);
        builder.HasIndex(x => new { x.UserId, x.LearningMaterialId }).IsUnique();
    }
}
