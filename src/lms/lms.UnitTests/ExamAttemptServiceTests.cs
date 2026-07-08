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

    [Fact]
    public async Task Submit_ShouldScoreEachQuestionAsEqualShareOf100()
    {
        var context = CreateDbContext();
        var service = CreateService(context);

        await context.Exams.AddAsync(new Exam
        {
            Id = 20,
            Name = "Bai thi tinh diem",
            DurationMinutes = 30,
            IsPublished = true,
            PassScore = 70
        });
        await context.ExamAttempts.AddAsync(new ExamAttempt
        {
            Id = 21,
            ExamId = 20,
            UserId = 2,
            StartedAt = DateTime.UtcNow,
            DurationMinutes = 30,
            Status = AttemptStatus.InProgress
        });

        for (var i = 1; i <= 5; i++)
        {
            await context.AttemptQuestionSnapshots.AddAsync(new AttemptQuestionSnapshot
            {
                AttemptId = 21,
                QuestionId = i,
                Content = "Question " + i,
                QuestionType = "SingleChoice",
                Score = 5,
                Order = i
            });
            await context.AttemptAnswerSnapshots.AddAsync(new AttemptAnswerSnapshot
            {
                AttemptId = 21,
                QuestionId = i,
                AnswerOptionId = i * 10,
                Content = "Correct " + i,
                IsCorrect = true,
                Order = 1
            });
            await context.AttemptAnswerSnapshots.AddAsync(new AttemptAnswerSnapshot
            {
                AttemptId = 21,
                QuestionId = i,
                AnswerOptionId = i * 10 + 1,
                Content = "Wrong " + i,
                IsCorrect = false,
                Order = 2
            });
        }

        await context.SaveChangesAsync();

        var result = await service.SubmitAsync(2, 21, new SubmitAttemptRequest
        {
            Answers =
            [
                new QuestionAnswerDto { QuestionId = 1, SelectedOptionIds = [10] },
                new QuestionAnswerDto { QuestionId = 2, SelectedOptionIds = [20] },
                new QuestionAnswerDto { QuestionId = 3, SelectedOptionIds = [31] },
                new QuestionAnswerDto { QuestionId = 4, SelectedOptionIds = [41] },
                new QuestionAnswerDto { QuestionId = 5, SelectedOptionIds = [51] }
            ]
        });

        Assert.True(result.Success);
        Assert.Equal(40m, result.Data!.Score);
        Assert.False(result.Data.Passed);
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
            new QuestionCategoryRepository(context),
            new AnswerOptionRepository(context),
            access.Object,
            resultService.Object,
            audit.Object);
    }
}
