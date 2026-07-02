using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace lms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLearningMaterialBlocksAndCourseThumbnails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ThumbnailContentType",
                table: "Courses",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ThumbnailFileKey",
                table: "Courses",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ThumbnailOriginalFileName",
                table: "Courses",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ThumbnailUrl",
                table: "Courses",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LearningMaterialBlocks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LearningMaterialId = table.Column<int>(type: "int", nullable: false),
                    BlockType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    TextContent = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Url = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Caption = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FileKey = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    OriginalFileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    FileSize = table.Column<long>(type: "bigint", nullable: true),
                    StorageProvider = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<int>(type: "int", nullable: true),
                    UpdatedBy = table.Column<int>(type: "int", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningMaterialBlocks", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LearningMaterialBlocks_BlockType",
                table: "LearningMaterialBlocks",
                column: "BlockType");

            migrationBuilder.CreateIndex(
                name: "IX_LearningMaterialBlocks_LearningMaterialId",
                table: "LearningMaterialBlocks",
                column: "LearningMaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningMaterialBlocks_LearningMaterialId_SortOrder",
                table: "LearningMaterialBlocks",
                columns: new[] { "LearningMaterialId", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LearningMaterialBlocks");

            migrationBuilder.DropColumn(
                name: "ThumbnailContentType",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "ThumbnailFileKey",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "ThumbnailOriginalFileName",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "ThumbnailUrl",
                table: "Courses");
        }
    }
}
