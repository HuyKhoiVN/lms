using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class CertificateConfiguration : IEntityTypeConfiguration<Certificate>
{
    public void Configure(EntityTypeBuilder<Certificate> builder)
    {
        builder.ToTable("Certificates");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.ExamId).IsRequired();
        builder.Property(x => x.CertificateCode).IsRequired().HasMaxLength(100);
        builder.Property(x => x.IssuedDate).IsRequired();

        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.ExamId);
        builder.HasIndex(x => x.CertificateCode).IsUnique();
        builder.HasIndex(x => x.IssuedDate);
    }
}
