using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Exams;
using lms.Application.DTOs.Results;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

/// <summary>
/// Business rules theo doc/17 mục 12:
/// - Student chỉ xem result của mình.
/// - Review phải tôn trọng ReviewMode (NoReview/ResultOnly/AnswerOnly/FullReview).
/// - Scoring dựa trên snapshot (đã được tính ở Phase 6 submit).
/// </summary>
public sealed class ResultService : IResultService
{
    private readonly IExamResultRepository _resultRepo;
    private readonly IExamResultDetailRepository _detailRepo;
    private readonly IExamAttemptRepository _attemptRepo;
    private readonly IAttemptQuestionSnapshotRepository _qsRepo;
    private readonly IAttemptAnswerSnapshotRepository _asRepo;
    private readonly IAttemptAnswerRepository _answerRepo;
    private readonly IExamRepository _examRepo;
    private readonly IUserRepository _userRepo;

    public ResultService(
        IExamResultRepository resultRepo,
        IExamResultDetailRepository detailRepo,
        IExamAttemptRepository attemptRepo,
        IAttemptQuestionSnapshotRepository qsRepo,
        IAttemptAnswerSnapshotRepository asRepo,
        IAttemptAnswerRepository answerRepo,
        IExamRepository examRepo,
        IUserRepository userRepo)
    {
        _resultRepo = resultRepo;
        _detailRepo = detailRepo;
        _attemptRepo = attemptRepo;
        _qsRepo = qsRepo;
        _asRepo = asRepo;
        _answerRepo = answerRepo;
        _examRepo = examRepo;
        _userRepo = userRepo;
    }

    // ─── List my results (Student) ─────────────────────────────────────────────

    public async Task<ApiResponse<PagedResult<ResultListItemResponse>>> GetMyResultsAsync(
        int userId, MyResultFilterRequest filter)
    {
        var page = filter.Page < 1 ? 1 : filter.Page;
        var size = filter.PageSize is < 1 or > 100 ? 20 : filter.PageSize;

        var items = await _resultRepo.GetByUserIdAsync(userId, filter.ExamId, page, size);
        var total = await _resultRepo.GetCountByUserIdAsync(userId, filter.ExamId);

        var list = new List<ResultListItemResponse>(items.Count);
        foreach (var r in items)
        {
            var exam = await _examRepo.GetByIdAsync(r.ExamId);
            list.Add(new ResultListItemResponse
            {
                Id = r.Id, AttemptId = r.AttemptId, ExamId = r.ExamId,
                ExamName = exam?.Name, UserId = r.UserId,
                Score = r.Score, Passed = r.Passed, CompletedDate = r.CompletedDate
            });
        }

        return ApiResponse<PagedResult<ResultListItemResponse>>.SuccessResult(
            new PagedResult<ResultListItemResponse>(list, total, page, size));
    }

    // ─── List all results (Admin) ──────────────────────────────────────────────

    public async Task<ApiResponse<PagedResult<ResultListItemResponse>>> GetAllResultsAsync(ResultFilterRequest filter)
    {
        var page = filter.Page < 1 ? 1 : filter.Page;
        var size = filter.PageSize is < 1 or > 100 ? 20 : filter.PageSize;

        var items = await _resultRepo.GetPagedAsync(filter.ExamId, filter.UserId, page, size);
        var total = await _resultRepo.GetCountAsync(filter.ExamId, filter.UserId);

        var list = new List<ResultListItemResponse>(items.Count);
        foreach (var r in items)
        {
            var exam = await _examRepo.GetByIdAsync(r.ExamId);
            var user = await _userRepo.GetByIdAsync(r.UserId);
            list.Add(new ResultListItemResponse
            {
                Id = r.Id, AttemptId = r.AttemptId, ExamId = r.ExamId,
                ExamName = exam?.Name, UserId = r.UserId, UserName = user?.UserName,
                Score = r.Score, Passed = r.Passed, CompletedDate = r.CompletedDate
            });
        }

        return ApiResponse<PagedResult<ResultListItemResponse>>.SuccessResult(
            new PagedResult<ResultListItemResponse>(list, total, page, size));
    }

    // ─── Detail ────────────────────────────────────────────────────────────────

    public async Task<ApiResponse<ResultDetailResponse>> GetByIdAsync(int id, int? requestingUserId, bool isAdmin)
    {
        var result = await _resultRepo.GetByIdAsync(id);
        if (result is null) return ApiResponse<ResultDetailResponse>.FailureResult("Không tìm thấy kết quả.");

        if (!isAdmin && result.UserId != requestingUserId)
            return ApiResponse<ResultDetailResponse>.FailureResult("Bạn không có quyền xem kết quả này.");

        var exam = await _examRepo.GetByIdAsync(result.ExamId);
        var user = await _userRepo.GetByIdAsync(result.UserId);
        var details = await _detailRepo.GetByResultIdAsync(result.Id);

        var qSnaps = await _qsRepo.GetByAttemptIdAsync(result.AttemptId);

        var detailList = details.Select(d =>
        {
            var qs = qSnaps.FirstOrDefault(q => q.QuestionId == d.QuestionId);
            return new QuestionResultResponse
            {
                QuestionId = d.QuestionId,
                QuestionContent = qs?.Content,
                IsCorrect = d.IsCorrect,
                ScoreEarned = d.ScoreEarned
            };
        }).ToList();

        return ApiResponse<ResultDetailResponse>.SuccessResult(new ResultDetailResponse
        {
            Id = result.Id, AttemptId = result.AttemptId, ExamId = result.ExamId,
            ExamName = exam?.Name, UserId = result.UserId, UserName = user?.UserName,
            Score = result.Score, Passed = result.Passed, CompletedDate = result.CompletedDate,
            Details = detailList
        });
    }

    // ─── Review (ReviewMode enforcement) ───────────────────────────────────────

    public async Task<ApiResponse<ResultReviewResponse>> GetReviewAsync(int id, int? requestingUserId, bool isAdmin)
    {
        var result = await _resultRepo.GetByIdAsync(id);
        if (result is null) return ApiResponse<ResultReviewResponse>.FailureResult("Không tìm thấy kết quả.");

        if (!isAdmin && result.UserId != requestingUserId)
            return ApiResponse<ResultReviewResponse>.FailureResult("Bạn không có quyền xem review này.");

        var exam = await _examRepo.GetByIdAsync(result.ExamId);
        var reviewMode = exam?.ReviewMode ?? ExamReviewMode.ResultOnly;

        // NoReview → chặn
        if (reviewMode == ExamReviewMode.NoReview)
            return ApiResponse<ResultReviewResponse>.FailureResult("Bài thi không hỗ trợ xem review.");

        // Build review
        var details = await _detailRepo.GetByResultIdAsync(result.Id);
        var qSnaps = await _qsRepo.GetByAttemptIdAsync(result.AttemptId);
        var aSnaps = await _asRepo.GetByAttemptIdAsync(result.AttemptId);
        var userAnswers = await _answerRepo.GetByAttemptIdAsync(result.AttemptId);
        var scorePerQuestion = CalculateScorePerQuestion(qSnaps.Count);

        var questions = new List<QuestionReviewResponse>();

        foreach (var qs in qSnaps)
        {
            var det = details.FirstOrDefault(d => d.QuestionId == qs.QuestionId);
            var qOptions = aSnaps.Where(a => a.QuestionId == qs.QuestionId).OrderBy(a => a.Order).ToList();
            var selected = userAnswers.Where(a => a.QuestionId == qs.QuestionId).Select(a => a.AnswerOptionId).ToHashSet();

            var optResponses = qOptions.Select(o => new AnswerReviewResponse
            {
                AnswerOptionId = o.AnswerOptionId,
                Content = o.Content,
                // Expose correct/selected dựa ReviewMode
                IsCorrect = reviewMode == ExamReviewMode.FullReview || reviewMode == ExamReviewMode.AnswerOnly
                    ? o.IsCorrect : false,
                WasSelected = reviewMode != ExamReviewMode.ResultOnly
                    ? selected.Contains(o.AnswerOptionId) : false
            }).ToList();

            questions.Add(new QuestionReviewResponse
            {
                QuestionId = qs.QuestionId, Content = qs.Content,
                QuestionType = qs.QuestionType, MaxScore = scorePerQuestion,
                ScoreEarned = det?.ScoreEarned ?? 0, IsCorrect = det?.IsCorrect ?? false,
                Options = optResponses
            });
        }

        return ApiResponse<ResultReviewResponse>.SuccessResult(new ResultReviewResponse
        {
            Id = result.Id, ExamId = result.ExamId,
            Score = result.Score, Passed = result.Passed,
            ReviewMode = reviewMode, Questions = questions
        });
    }

    // ─── Generate result from attempt ──────────────────────────────────────────

    public async Task GenerateResultAsync(int attemptId)
    {
        // Idempotent: nếu result đã có → skip
        var existing = await _resultRepo.GetByAttemptIdAsync(attemptId);
        if (existing != null) return;

        var attempt = await _attemptRepo.GetByIdAsync(attemptId);
        if (attempt is null || attempt.Status is not ("Submitted" or "AutoSubmitted")) return;

        // Score per question
        var qSnaps = await _qsRepo.GetByAttemptIdAsync(attemptId);
        var allASnaps = await _asRepo.GetByAttemptIdAsync(attemptId);
        var allAnswers = await _answerRepo.GetByAttemptIdAsync(attemptId);
        var scorePerQuestion = CalculateScorePerQuestion(qSnaps.Count);

        var resultEntity = new ExamResult
        {
            AttemptId = attemptId,
            ExamId = attempt.ExamId,
            UserId = attempt.UserId,
            Score = attempt.Score ?? 0,
            Passed = attempt.Passed ?? false,
            CompletedDate = attempt.SubmittedAt ?? DateTime.UtcNow,
            CreatedDate = DateTime.UtcNow
        };

        await _resultRepo.AddAsync(resultEntity);

        // Details
        var details = new List<ExamResultDetail>();
        foreach (var qs in qSnaps)
        {
            var correctIds = allASnaps
                .Where(a => a.QuestionId == qs.QuestionId && a.IsCorrect)
                .Select(a => a.AnswerOptionId).ToHashSet();
            var selectedIds = allAnswers
                .Where(a => a.QuestionId == qs.QuestionId)
                .Select(a => a.AnswerOptionId).ToHashSet();

            bool isCorrect = correctIds.SetEquals(selectedIds);

            details.Add(new ExamResultDetail
            {
                ExamResultId = resultEntity.Id,
                QuestionId = qs.QuestionId,
                IsCorrect = isCorrect,
                ScoreEarned = isCorrect ? scorePerQuestion : 0
            });
        }

        if (details.Count > 0)
            await _detailRepo.AddRangeAsync(details);
    }

    private static decimal CalculateScorePerQuestion(int questionCount)
    {
        return questionCount <= 0
            ? 0m
            : Math.Round(100m / questionCount, 2, MidpointRounding.AwayFromZero);
    }
}
