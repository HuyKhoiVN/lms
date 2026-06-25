using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class CertificateFileConfiguration : IEntityTypeConfiguration<CertificateFile>
{
    public void Configure(EntityTypeBuilder<CertificateFile> builder)
    {
        builder.ToTable("CertificateFiles");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CertificateId).IsRequired();
        builder.Property(x => x.OriginalFileName).IsRequired().HasMaxLength(255);
        builder.Property(x => x.StoredFileName).IsRequired().HasMaxLength(255);
        builder.Property(x => x.FileSize).IsRequired();
        builder.Property(x => x.StoragePath).IsRequired().HasMaxLength(500);

        builder.HasIndex(x => x.CertificateId);
    }
}
