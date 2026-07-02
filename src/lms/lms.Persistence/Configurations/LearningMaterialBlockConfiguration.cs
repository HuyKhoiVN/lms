using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class LearningMaterialBlockConfiguration : IEntityTypeConfiguration<LearningMaterialBlock>
{
    public void Configure(EntityTypeBuilder<LearningMaterialBlock> builder)
    {
        builder.ToTable("LearningMaterialBlocks");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.LearningMaterialId).IsRequired();
        builder.Property(x => x.BlockType).IsRequired().HasMaxLength(30);
        builder.Property(x => x.SortOrder).IsRequired();
        builder.Property(x => x.TextContent);
        builder.Property(x => x.Url).HasMaxLength(1000);
        builder.Property(x => x.Caption).HasMaxLength(500);
        builder.Property(x => x.FileKey).HasMaxLength(500);
        builder.Property(x => x.OriginalFileName).HasMaxLength(255);
        builder.Property(x => x.ContentType).HasMaxLength(100);
        builder.Property(x => x.StorageProvider).HasMaxLength(50);

        builder.HasIndex(x => x.LearningMaterialId);
        builder.HasIndex(x => new { x.LearningMaterialId, x.SortOrder });
        builder.HasIndex(x => x.BlockType);
    }
}
