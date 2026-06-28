using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Token).IsRequired().HasMaxLength(255);
        builder.Property(x => x.CreatedByIp).HasMaxLength(50);
        builder.Property(x => x.RevokedByIp).HasMaxLength(50);
        builder.Property(x => x.ReplacedByToken).HasMaxLength(255);

        builder.HasIndex(x => x.UserId);

        // Theo doc/17_BACKEND_MODULE_DESIGN/README.md (gap "RefreshTokens.Token nen unique"):
        // Filtered unique index trên Token chỉ áp dụng cho token chưa thu hồi.
        // Cho phép giữ lại lịch sử token đã revoke có cùng giá trị (rất hiếm) mà không vi phạm uniqueness.
        builder.HasIndex(x => x.Token)
            .IsUnique()
            .HasDatabaseName("UX_RefreshTokens_Token_Active")
            .HasFilter("[Revoked] IS NULL");
    }
}
