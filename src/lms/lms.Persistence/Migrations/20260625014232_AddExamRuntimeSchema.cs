using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace lms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddExamRuntimeSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AttemptAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AttemptId = table.Column<int>(type: "int", nullable: false),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    AnswerOptionId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttemptAnswers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AttemptAnswerSnapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AttemptId = table.Column<int>(type: "int", nullable: false),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    AnswerOptionId = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttemptAnswerSnapshots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AttemptEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AttemptId = table.Column<int>(type: "int", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EventData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttemptEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AttemptQuestionSnapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AttemptId = table.Column<int>(type: "int", nullable: false),
                    QuestionId = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QuestionType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Score = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttemptQuestionSnapshots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ExamAttempts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExamId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DurationMinutes = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Score = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Passed = table.Column<bool>(type: "bit", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<int>(type: "int", nullable: true),
                    UpdatedBy = table.Column<int>(type: "int", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamAttempts", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AttemptAnswers_AnswerOptionId",
                table: "AttemptAnswers",
                column: "AnswerOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_AttemptAnswers_AttemptId",
                table: "AttemptAnswers",
                column: "AttemptId");

            migrationBuilder.CreateIndex(
                name: "IX_AttemptAnswers_AttemptId_QuestionId_AnswerOptionId",
                table: "AttemptAnswers",
                columns: new[] { "AttemptId", "QuestionId", "AnswerOptionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AttemptAnswers_QuestionId",
                table: "AttemptAnswers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_AttemptAnswerSnapshots_AnswerOptionId",
                table: "AttemptAnswerSnapshots",
                column: "AnswerOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_AttemptAnswerSnapshots_AttemptId",
                table: "AttemptAnswerSnapshots",
                column: "AttemptId");

            migrationBuilder.CreateIndex(
                name: "IX_AttemptAnswerSnapshots_AttemptId_AnswerOptionId",
                table: "AttemptAnswerSnapshots",
                columns: new[] { "AttemptId", "AnswerOptionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AttemptAnswerSnapshots_QuestionId",
                table: "AttemptAnswerSnapshots",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_AttemptEvents_AttemptId",
                table: "AttemptEvents",
                column: "AttemptId");

            migrationBuilder.CreateIndex(
                name: "IX_AttemptEvents_CreatedDate",
                table: "AttemptEvents",
                column: "CreatedDate");

            migrationBuilder.CreateIndex(
                name: "IX_AttemptEvents_EventType",
                table: "AttemptEvents",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "IX_AttemptQuestionSnapshots_AttemptId",
                table: "AttemptQuestionSnapshots",
                column: "AttemptId");

            migrationBuilder.CreateIndex(
                name: "IX_AttemptQuestionSnapshots_AttemptId_QuestionId",
                table: "AttemptQuestionSnapshots",
                columns: new[] { "AttemptId", "QuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AttemptQuestionSnapshots_QuestionId",
                table: "AttemptQuestionSnapshots",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_ExamAttempts_ExamId",
                table: "ExamAttempts",
                column: "ExamId");

            migrationBuilder.CreateIndex(
                name: "IX_ExamAttempts_StartedAt",
                table: "ExamAttempts",
                column: "StartedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ExamAttempts_Status",
                table: "ExamAttempts",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ExamAttempts_SubmittedAt",
                table: "ExamAttempts",
                column: "SubmittedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ExamAttempts_UserId",
                table: "ExamAttempts",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AttemptAnswers");

            migrationBuilder.DropTable(
                name: "AttemptAnswerSnapshots");

            migrationBuilder.DropTable(
                name: "AttemptEvents");

            migrationBuilder.DropTable(
                name: "AttemptQuestionSnapshots");

            migrationBuilder.DropTable(
                name: "ExamAttempts");
        }
    }
}
