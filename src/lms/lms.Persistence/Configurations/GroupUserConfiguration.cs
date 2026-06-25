using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class GroupUserConfiguration : IEntityTypeConfiguration<GroupUser>
{
    public void Configure(EntityTypeBuilder<GroupUser> builder)
    {
        builder.ToTable("GroupUsers");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.GroupId).IsRequired();
        builder.Property(x => x.UserId).IsRequired();

        builder.HasIndex(x => x.GroupId);
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => new { x.GroupId, x.UserId }).IsUnique();
    }
}
