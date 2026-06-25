using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class LearningMaterialConfiguration : IEntityTypeConfiguration<LearningMaterial>
{
    public void Configure(EntityTypeBuilder<LearningMaterial> builder)
    {
        builder.ToTable("LearningMaterials");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CourseId).IsRequired();
        builder.Property(x => x.Title).IsRequired().HasMaxLength(255);
        builder.Property(x => x.ContentType).IsRequired().HasMaxLength(50);
        builder.Property(x => x.ExternalLink).HasMaxLength(1000);
        builder.Property(x => x.TextContent); // defaults to nvarchar(max)
        builder.Property(x => x.Order).IsRequired();

        builder.HasIndex(x => x.CourseId);
        builder.HasIndex(x => x.ContentType);
    }
}
