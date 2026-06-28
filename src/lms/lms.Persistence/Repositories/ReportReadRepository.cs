using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.DTOs.Reports;
using lms.Application.Interfaces.Repositories;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public sealed class ReportReadRepository : IReportReadRepository
{
    private readonly LmsDbContext _ctx;

    public ReportReadRepository(LmsDbContext ctx)
    {
        _ctx = ctx;
    }

    public async Task<ExamSummaryReportResponse> GetExamSummaryAsync(ReportFilterRequest filter)
    {
        var query = ApplyResultFilters(filter);

        var rows = await query
            .GroupBy(x => x.ExamId)
            .Select(g => new
            {
                ExamId = g.Key,
                AttemptCount = g.Count(),
                PassedCount = g.Count(x => x.Passed),
                AverageScore = g.Average(x => x.Score)
            })
            .OrderBy(x => x.ExamId)
            .Skip((NormalizePage(filter.Page) - 1) * NormalizePageSize(filter.PageSize))
            .Take(NormalizePageSize(filter.PageSize))
            .ToListAsync();

        var examIds = rows.Select(x => x.ExamId).ToList();
        var names = await _ctx.Exams.AsNoTracking()
            .Where(x => examIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.Name);

        var all = await query.ToListAsync();
        return new ExamSummaryReportResponse
        {
            TotalAttempts = all.Count,
            SubmittedAttempts = all.Count,
            PassedCount = all.Count(x => x.Passed),
            AverageScore = all.Count == 0 ? 0 : Math.Round(all.Average(x => x.Score), 2),
            Items = rows.Select(x => new ExamSummaryReportItem
            {
                ExamId = x.ExamId,
                ExamName = names.TryGetValue(x.ExamId, out var name) ? name : string.Empty,
                AttemptCount = x.AttemptCount,
                PassedCount = x.PassedCount,
                AverageScore = Math.Round(x.AverageScore, 2)
            }).ToList()
        };
    }

    public async Task<PassRateReportResponse> GetPassRateAsync(ReportFilterRequest filter)
    {
        var query = ApplyResultFilters(filter);
        var rows = await query
            .GroupBy(x => x.ExamId)
            .Select(g => new
            {
                ExamId = g.Key,
                TotalResults = g.Count(),
                PassedCount = g.Count(x => x.Passed)
            })
            .OrderBy(x => x.ExamId)
            .Skip((NormalizePage(filter.Page) - 1) * NormalizePageSize(filter.PageSize))
            .Take(NormalizePageSize(filter.PageSize))
            .ToListAsync();

        var examIds = rows.Select(x => x.ExamId).ToList();
        var names = await _ctx.Exams.AsNoTracking()
            .Where(x => examIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.Name);

        var total = await query.CountAsync();
        var passed = await query.CountAsync(x => x.Passed);
        return new PassRateReportResponse
        {
            TotalResults = total,
            PassedCount = passed,
            PassRatePercent = Percent(passed, total),
            Items = rows.Select(x => new PassRateReportItem
            {
                ExamId = x.ExamId,
                ExamName = names.TryGetValue(x.ExamId, out var name) ? name : string.Empty,
                TotalResults = x.TotalResults,
                PassedCount = x.PassedCount,
                PassRatePercent = Percent(x.PassedCount, x.TotalResults)
            }).ToList()
        };
    }

    public async Task<QuestionAnalysisReportResponse> GetQuestionAnalysisAsync(ReportFilterRequest filter)
    {
        var resultIds = ApplyResultFilters(filter).Select(x => x.Id);
        var details = _ctx.ExamResultDetails.AsNoTracking().Where(x => resultIds.Contains(x.ExamResultId));

        var rows = await details
            .GroupBy(x => x.QuestionId)
            .Select(g => new
            {
                QuestionId = g.Key,
                AnswerCount = g.Count(),
                CorrectCount = g.Count(x => x.IsCorrect)
            })
            .OrderBy(x => x.QuestionId)
            .Skip((NormalizePage(filter.Page) - 1) * NormalizePageSize(filter.PageSize))
            .Take(NormalizePageSize(filter.PageSize))
            .ToListAsync();

        var questionIds = rows.Select(x => x.QuestionId).ToList();
        var contentFromBank = await _ctx.Questions.AsNoTracking()
            .Where(x => questionIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.Content);
        var contentFromSnapshots = await _ctx.AttemptQuestionSnapshots.AsNoTracking()
            .Where(x => questionIds.Contains(x.QuestionId))
            .GroupBy(x => x.QuestionId)
            .Select(g => new { QuestionId = g.Key, Content = g.Select(x => x.Content).FirstOrDefault() ?? string.Empty })
            .ToDictionaryAsync(x => x.QuestionId, x => x.Content);

        return new QuestionAnalysisReportResponse
        {
            Items = rows.Select(x => new QuestionAnalysisReportItem
            {
                QuestionId = x.QuestionId,
                QuestionContent = contentFromBank.TryGetValue(x.QuestionId, out var bankContent)
                    ? bankContent
                    : contentFromSnapshots.GetValueOrDefault(x.QuestionId, string.Empty),
                AnswerCount = x.AnswerCount,
                CorrectCount = x.CorrectCount,
                CorrectRatePercent = Percent(x.CorrectCount, x.AnswerCount)
            }).ToList()
        };
    }

    public async Task<LearningSummaryReportResponse> GetLearningSummaryAsync(ReportFilterRequest filter)
    {
        var query = _ctx.LearningProgress.AsNoTracking().Where(x => !x.IsDelete);
        if (filter.CourseId.HasValue) query = query.Where(x => x.CourseId == filter.CourseId.Value);
        if (filter.UserId.HasValue) query = query.Where(x => x.UserId == filter.UserId.Value);
        if (filter.FromDate.HasValue) query = query.Where(x => x.CreatedDate >= filter.FromDate.Value);
        if (filter.ToDate.HasValue) query = query.Where(x => x.CreatedDate <= filter.ToDate.Value);

        var rows = await query
            .GroupBy(x => x.CourseId)
            .Select(g => new
            {
                CourseId = g.Key,
                UserCount = g.Select(x => x.UserId).Distinct().Count(),
                CompletedCount = g.Count(x => x.IsCompleted),
                AverageProgress = g.Average(x => x.ProgressPercent)
            })
            .OrderBy(x => x.CourseId)
            .Skip((NormalizePage(filter.Page) - 1) * NormalizePageSize(filter.PageSize))
            .Take(NormalizePageSize(filter.PageSize))
            .ToListAsync();

        var courseIds = rows.Select(x => x.CourseId).ToList();
        var names = await _ctx.Courses.AsNoTracking()
            .Where(x => courseIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.Name);

        var all = await query.ToListAsync();
        return new LearningSummaryReportResponse
        {
            TotalProgressRecords = all.Count,
            CompletedCount = all.Count(x => x.IsCompleted),
            AverageProgressPercent = all.Count == 0 ? 0 : Math.Round(all.Average(x => x.ProgressPercent), 2),
            Items = rows.Select(x => new LearningSummaryReportItem
            {
                CourseId = x.CourseId,
                CourseName = names.TryGetValue(x.CourseId, out var name) ? name : string.Empty,
                UserCount = x.UserCount,
                CompletedCount = x.CompletedCount,
                AverageProgressPercent = Math.Round(x.AverageProgress, 2)
            }).ToList()
        };
    }

    private IQueryable<Domain.Entities.ExamResult> ApplyResultFilters(ReportFilterRequest filter)
    {
        var query = _ctx.ExamResults.AsNoTracking().Where(x => !x.IsDelete);
        if (filter.ExamId.HasValue) query = query.Where(x => x.ExamId == filter.ExamId.Value);
        if (filter.UserId.HasValue) query = query.Where(x => x.UserId == filter.UserId.Value);
        if (filter.FromDate.HasValue) query = query.Where(x => x.CompletedDate >= filter.FromDate.Value);
        if (filter.ToDate.HasValue) query = query.Where(x => x.CompletedDate <= filter.ToDate.Value);
        if (filter.CourseId.HasValue)
        {
            var examIds = _ctx.CourseExams.AsNoTracking()
                .Where(x => x.CourseId == filter.CourseId.Value)
                .Select(x => x.ExamId);
            query = query.Where(x => examIds.Contains(x.ExamId));
        }
        return query;
    }

    private static int NormalizePage(int page) => page < 1 ? 1 : page;
    private static int NormalizePageSize(int pageSize) => pageSize is < 1 or > 200 ? 20 : pageSize;
    private static decimal Percent(int value, int total) => total == 0 ? 0 : Math.Round(value * 100m / total, 2);
}
