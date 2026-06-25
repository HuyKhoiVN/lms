using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class LearningMaterialFileConfiguration : IEntityTypeConfiguration<LearningMaterialFile>
{
    public void Configure(EntityTypeBuilder<LearningMaterialFile> builder)
    {
        builder.ToTable("LearningMaterialFiles");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.LearningMaterialId).IsRequired();
        builder.Property(x => x.OriginalFileName).IsRequired().HasMaxLength(255);
        builder.Property(x => x.StoredFileName).IsRequired().HasMaxLength(255);
        builder.Property(x => x.FileSize).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(100);
        builder.Property(x => x.StoragePath).IsRequired().HasMaxLength(500);
        builder.Property(x => x.StorageProvider).HasMaxLength(50);

        builder.HasIndex(x => x.LearningMaterialId);
    }
}
