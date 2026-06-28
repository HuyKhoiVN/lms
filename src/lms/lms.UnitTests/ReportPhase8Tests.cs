using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using lms.Application.DTOs.Reports;
using lms.Application.Interfaces.Services;
using lms.Application.Services;
using lms.Domain.Entities;
using lms.Persistence.Context;
using lms.Persistence.Repositories;

namespace lms.UnitTests;

public class ReportPhase8Tests
{
    private static LmsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<LmsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new LmsDbContext(options);
    }

    [Fact]
    public async Task PassRate_ShouldApplyExamFilter()
    {
        var context = CreateDbContext();
        await SeedResultsAsync(context);
        var repo = new ReportReadRepository(context);

        var report = await repo.GetPassRateAsync(new ReportFilterRequest { ExamId = 1 });

        Assert.Equal(2, report.TotalResults);
        Assert.Equal(1, report.PassedCount);
        Assert.Equal(50, report.PassRatePercent);
    }

    [Fact]
    public async Task ExportCsv_ShouldReturnCsvContent()
    {
        var context = CreateDbContext();
        await SeedResultsAsync(context);
        var audit = new Mock<IAuditLogService>();
        var service = new ReportExportService(new ReportReadRepository(context), audit.Object);

        var result = await service.ExportCsvAsync(new ReportExportRequest { ReportType = "pass-rate" }, adminId: 1);

        Assert.True(result.Success);
        Assert.Equal("text/csv; charset=utf-8", result.Data!.ContentType);
        Assert.EndsWith(".csv", result.Data.FileName);
        Assert.NotEmpty(result.Data.Content);
    }

    [Fact]
    public async Task ExportPdf_ShouldReturnPdfContent()
    {
        var context = CreateDbContext();
        await SeedResultsAsync(context);
        var audit = new Mock<IAuditLogService>();
        var service = new ReportExportService(new ReportReadRepository(context), audit.Object);

        var result = await service.ExportPdfAsync(new ReportExportRequest { ReportType = "exam-summary" }, adminId: 1);

        Assert.True(result.Success);
        Assert.Equal("application/pdf", result.Data!.ContentType);
        Assert.StartsWith("%PDF", System.Text.Encoding.ASCII.GetString(result.Data.Content));
    }

    [Fact]
    public async Task AuditLogRepository_ShouldFilterByEntityName()
    {
        var context = CreateDbContext();
        var repo = new AuditLogRepository(context);

        await repo.AddAsync(new AuditLog { Action = "VIEW_REPORT", EntityName = "Report", CreatedDate = DateTime.UtcNow });
        await repo.AddAsync(new AuditLog { Action = "VIEW_REPORT", EntityName = "Certificate", CreatedDate = DateTime.UtcNow });

        var logs = await repo.GetPagedAsync(null, "VIEW_REPORT", "Report", null, null, 1, 20);
        var count = await repo.GetCountAsync(null, "VIEW_REPORT", "Report", null, null);

        Assert.Single(logs);
        Assert.Equal(1, count);
        Assert.Equal("Report", logs[0].EntityName);
    }

    [Fact]
    public async Task AuditLogService_ShouldMaskSensitiveJsonFields()
    {
        var context = CreateDbContext();
        var service = new AuditLogService(new AuditLogRepository(context));

        await service.LogActionAsync(
            1,
            "RESET_PASSWORD",
            "User",
            2,
            null,
            "{\"Password\":\"secret\",\"RefreshToken\":\"token-value\",\"Safe\":\"ok\"}");

        var log = await context.AuditLogs.FirstAsync();

        Assert.DoesNotContain("secret", log.AfterData);
        Assert.DoesNotContain("token-value", log.AfterData);
        Assert.Contains("\"Safe\":\"ok\"", log.AfterData);
    }

    private static async Task SeedResultsAsync(LmsDbContext context)
    {
        await context.Exams.AddRangeAsync(
            new Exam { Id = 1, Name = "Safety Exam" },
            new Exam { Id = 2, Name = "Security Exam" });
        await context.ExamResults.AddRangeAsync(
            new ExamResult { ExamId = 1, UserId = 1, AttemptId = 1, Score = 80, Passed = true, CompletedDate = DateTime.UtcNow },
            new ExamResult { ExamId = 1, UserId = 2, AttemptId = 2, Score = 40, Passed = false, CompletedDate = DateTime.UtcNow },
            new ExamResult { ExamId = 2, UserId = 1, AttemptId = 3, Score = 90, Passed = true, CompletedDate = DateTime.UtcNow });
        await context.SaveChangesAsync();
    }
}
