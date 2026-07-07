using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace lms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLearningMaterialDuration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DurationMinutes",
                table: "LearningMaterials",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DurationMinutes",
                table: "LearningMaterials");
        }
    }
}
