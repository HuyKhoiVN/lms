using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace lms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReportingOptimization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FileRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FileKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    OriginalFileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    StoredFileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    StoragePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    StorageProvider = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Purpose = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<int>(type: "int", nullable: true),
                    UpdatedBy = table.Column<int>(type: "int", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileRecords", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExamResults_CompletedDate",
                table: "ExamResults",
                column: "CompletedDate");

            migrationBuilder.CreateIndex(
                name: "IX_Certificates_IssuedDate",
                table: "Certificates",
                column: "IssuedDate");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_CreatedDate",
                table: "AuditLogs",
                column: "CreatedDate");

            migrationBuilder.CreateIndex(
                name: "IX_FileRecords_FileKey",
                table: "FileRecords",
                column: "FileKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FileRecords_Purpose",
                table: "FileRecords",
                column: "Purpose");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FileRecords");

            migrationBuilder.DropIndex(
                name: "IX_ExamResults_CompletedDate",
                table: "ExamResults");

            migrationBuilder.DropIndex(
                name: "IX_Certificates_IssuedDate",
                table: "Certificates");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_CreatedDate",
                table: "AuditLogs");
        }
    }
}
