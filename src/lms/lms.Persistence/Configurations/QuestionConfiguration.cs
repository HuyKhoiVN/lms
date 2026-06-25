using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using lms.Domain.Entities;

namespace lms.Persistence.Configurations;

public sealed class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.ToTable("Questions");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CategoryId).IsRequired();
        builder.Property(x => x.Content).IsRequired(); // defaults to nvarchar(max)
        builder.Property(x => x.QuestionType).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Difficulty).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Order).IsRequired();

        builder.HasIndex(x => x.CategoryId);
        builder.HasIndex(x => x.QuestionType);
        builder.HasIndex(x => x.Difficulty);
    }
}
