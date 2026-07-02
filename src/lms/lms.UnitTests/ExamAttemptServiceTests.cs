using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using lms.Application.DTOs.ExamAttempts;
using lms.Application.Interfaces.Services;
using lms.Application.Services;
using lms.Domain.Entities;
using lms.Persistence.Context;
using lms.Persistence.Repositories;

namespace lms.UnitTests;

public class ExamAttemptServiceTests
{
    private static LmsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<LmsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new LmsDbContext(options);
    }

    [Fact]
    public async Task Start_ShouldResumeAndRepairExpiredActiveAttempt_WhenAttemptLimitReached()
    {
        var context = CreateDbContext();
        var service = CreateService(context);
        var oldStartedAt = DateTime.UtcNow.AddHours(-2);

        await context.Exams.AddAsync(new Exam
        {
            Id = 7,
            Name = "Bai thi demo",
            DurationMinutes = 30,
            AttemptLimit = 1,
            IsPublished = true,
            PassScore = 70
        });
        await context.ExamAttempts.AddAsync(new ExamAttempt
        {
            Id = 11,
            ExamId = 7,
            UserId = 2,
            StartedAt = oldStartedAt,
            DurationMinutes = 30,
            Status = AttemptStatus.InProgress
        });
        await context.SaveChangesAsync();

        var result = await service.StartExamAsync(2, new StartExamRequest { ExamId = 7 });

        Assert.True(result.Success);
        Assert.Equal(11, result.Data!.AttemptId);
        Assert.Equal(30, result.Data.DurationMinutes);

        var repaired = await context.ExamAttempts.FirstAsync(x => x.Id == 11);
        Assert.Equal(AttemptStatus.InProgress, repaired.Status);
        Assert.True(repaired.StartedAt > oldStartedAt);
        Assert.True(repaired.StartedAt > DateTime.UtcNow.AddMinutes(-1));
    }

    [Fact]
    public async Task GetActive_ShouldFallbackDurationFromExam_WhenAttemptDurationIsMissing()
    {
        var context = CreateDbContext();
        var service = CreateService(context);

        await context.Exams.AddAsync(new Exam
        {
            Id = 8,
            Name = "Bai thi co thoi luong",
            DurationMinutes = 45,
            IsPublished = true,
            PassScore = 70
        });
        await context.ExamAttempts.AddAsync(new ExamAttempt
        {
            Id = 12,
            ExamId = 8,
            UserId = 2,
            StartedAt = DateTime.UtcNow,
            DurationMinutes = null,
            Status = AttemptStatus.InProgress
        });
        await context.SaveChangesAsync();

        var result = await service.GetActiveAttemptAsync(2, 12);

        Assert.True(result.Success);
        Assert.Equal(45, result.Data!.DurationMinutes);
        Assert.Equal(DateTimeKind.Utc, result.Data.StartedAt.Kind);

        var repaired = await context.ExamAttempts.FirstAsync(x => x.Id == 12);
        Assert.Equal(45, repaired.DurationMinutes);
    }

    private static ExamAttemptService CreateService(LmsDbContext context)
    {
        var access = new Mock<IExamAccessService>();
        access.Setup(x => x.HasAccessAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(true);

        var resultService = new Mock<IResultService>();
        var audit = new Mock<IAuditLogService>();

        return new ExamAttemptService(
            new ExamAttemptRepository(context),
            new AttemptQuestionSnapshotRepository(context),
            new AttemptAnswerSnapshotRepository(context),
            new AttemptAnswerRepository(context),
            new AttemptEventRepository(context),
            new ExamRepository(context),
            new ExamQuestionRepository(context),
            new QuestionRepository(context),
            new AnswerOptionRepository(context),
            access.Object,
            resultService.Object,
            audit.Object);
    }
}
