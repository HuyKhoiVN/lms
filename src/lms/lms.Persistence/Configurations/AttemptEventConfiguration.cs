using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class AttemptEventConfiguration : IEntityTypeConfiguration<AttemptEvent>
{
    public void Configure(EntityTypeBuilder<AttemptEvent> builder)
    {
        builder.ToTable("AttemptEvents");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.AttemptId).IsRequired();
        builder.Property(x => x.EventType).IsRequired().HasMaxLength(50);
        builder.Property(x => x.EventData); // defaults to nvarchar(max)
        builder.Property(x => x.CreatedDate).IsRequired();

        builder.HasIndex(x => x.AttemptId);
        builder.HasIndex(x => x.EventType);
        builder.HasIndex(x => x.CreatedDate);
    }
}
