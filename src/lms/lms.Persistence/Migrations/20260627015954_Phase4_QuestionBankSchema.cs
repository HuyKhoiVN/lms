using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace lms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase4_QuestionBankSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Score",
                table: "Questions",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Score",
                table: "Questions");
        }
    }
}
