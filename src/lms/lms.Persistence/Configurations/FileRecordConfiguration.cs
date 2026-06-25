using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class FileRecordConfiguration : IEntityTypeConfiguration<FileRecord>
{
    public void Configure(EntityTypeBuilder<FileRecord> builder)
    {
        builder.ToTable("FileRecords");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.FileKey).IsRequired().HasMaxLength(100);
        builder.Property(x => x.OriginalFileName).IsRequired().HasMaxLength(255);
        builder.Property(x => x.StoredFileName).IsRequired().HasMaxLength(255);
        builder.Property(x => x.FileSize).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(100);
        builder.Property(x => x.StoragePath).IsRequired().HasMaxLength(500);
        builder.Property(x => x.StorageProvider).HasMaxLength(100);
        builder.Property(x => x.Purpose).HasMaxLength(100);

        // Indices
        builder.HasIndex(x => x.FileKey).IsUnique();
        builder.HasIndex(x => x.Purpose);
    }
}
