using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.ExamAttempts;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

/// <summary>
/// Critical path — Business rules theo doc/17 mục 10:
/// - Start: tạo ExamAttempt + snapshot question/answer.
/// - UI không nhận IsCorrect trước submit/review.
/// - Autosave chỉ attempt active, owner.
/// - Submit idempotent: lần 2 trả result cũ.
/// - Attempt submitted không sửa answer.
/// - Auto-submit dùng cùng pipeline submit (status "AutoSubmitted").
/// </summary>
public sealed class ExamAttemptService : IExamAttemptService
{
    private readonly IExamAttemptRepository _attemptRepo;
    private readonly IAttemptQuestionSnapshotRepository _qsRepo;
    private readonly IAttemptAnswerSnapshotRepository _asRepo;
    private readonly IAttemptAnswerRepository _answerRepo;
    private readonly IAttemptEventRepository _eventRepo;
    private readonly IExamRepository _examRepo;
    private readonly IExamQuestionRepository _examQuestionRepo;
    private readonly IQuestionRepository _questionRepo;
    private readonly IAnswerOptionRepository _answerOptionRepo;
    private readonly IExamAccessService _accessService;
    private readonly IResultService _resultService;
    private readonly IAuditLogService _audit;

    public ExamAttemptService(
        IExamAttemptRepository attemptRepo,
        IAttemptQuestionSnapshotRepository qsRepo,
        IAttemptAnswerSnapshotRepository asRepo,
        IAttemptAnswerRepository answerRepo,
        IAttemptEventRepository eventRepo,
        IExamRepository examRepo,
        IExamQuestionRepository examQuestionRepo,
        IQuestionRepository questionRepo,
        IAnswerOptionRepository answerOptionRepo,
        IExamAccessService accessService,
        IResultService resultService,
        IAuditLogService audit)
    {
        _attemptRepo = attemptRepo;
        _qsRepo = qsRepo;
        _asRepo = asRepo;
        _answerRepo = answerRepo;
        _eventRepo = eventRepo;
        _examRepo = examRepo;
        _examQuestionRepo = examQuestionRepo;
        _questionRepo = questionRepo;
        _answerOptionRepo = answerOptionRepo;
        _accessService = accessService;
        _resultService = resultService;
        _audit = audit;
    }

    // ─── Start ─────────────────────────────────────────────────────────────────

    public async Task<ApiResponse<StartExamResponse>> StartExamAsync(int userId, StartExamRequest request)
    {
        var exam = await _examRepo.GetByIdAsync(request.ExamId);
        if (exam is null) return Fail<StartExamResponse>("Không tìm thấy bài thi.");
        if (!exam.IsPublished) return Fail<StartExamResponse>("Bài thi chưa được publish.");

        // Access check
        if (!await _accessService.HasAccessAsync(userId, exam.Id))
            return Fail<StartExamResponse>("Bạn không có quyền thi bài thi này.");

        var now = DateTime.UtcNow;
        var active = await _attemptRepo.GetActiveByUserAndExamAsync(userId, exam.Id);

        // Attempt limit
        if (exam.AttemptLimit.HasValue && active == null)
        {
            var count = await _attemptRepo.GetAttemptCountAsync(userId, exam.Id);
            if (count >= exam.AttemptLimit.Value)
                return Fail<StartExamResponse>("Bạn đã hết lượt thi cho bài thi này.");
        }

        // Check already has active attempt → return it
        if (active != null)
        {
            await RepairAttemptRuntimeAsync(active, exam, now);
            var existingResponse = await BuildStartResponseAsync(active, exam);
            return ApiResponse<StartExamResponse>.SuccessResult(existingResponse, "Bạn đang có bài thi chưa hoàn thành.");
        }

        // Create attempt
        var attempt = new ExamAttempt
        {
            ExamId = exam.Id, UserId = userId,
            StartedAt = now,
            DurationMinutes = exam.DurationMinutes,
            Status = AttemptStatus.InProgress,
            IsDelete = false, CreatedDate = now
        };
        await _attemptRepo.AddAsync(attempt);

        // Build snapshots
        await CreateSnapshotsAsync(attempt.Id, exam);

        // Event
        await _eventRepo.AddAsync(new AttemptEvent
        {
            AttemptId = attempt.Id, EventType = "Start",
            EventData = $"{{\"ExamId\":{exam.Id}}}", CreatedDate = now
        });

        await _audit.LogActionAsync(userId, "START_EXAM", "ExamAttempt", attempt.Id,
            null, $"{{\"ExamId\":{exam.Id}}}");

        var response = await BuildStartResponseAsync(attempt, exam);
        return ApiResponse<StartExamResponse>.SuccessResult(response, "Bắt đầu bài thi thành công.");
    }

    // ─── Get active ────────────────────────────────────────────────────────────

    public async Task<ApiResponse<ExamAttemptTakingResponse>> GetActiveAttemptAsync(int userId, int attemptId)
    {
        var attempt = await _attemptRepo.GetByIdAsync(attemptId);
        if (attempt is null || attempt.UserId != userId)
            return Fail<ExamAttemptTakingResponse>("Không tìm thấy lần thi.");

        if (attempt.Status != AttemptStatus.InProgress)
            return Fail<ExamAttemptTakingResponse>("Lần thi đã kết thúc.");

        var exam = await _examRepo.GetByIdAsync(attempt.ExamId);
        await RepairAttemptRuntimeAsync(attempt, exam, DateTime.UtcNow);
        var durationMinutes = ResolveDurationMinutes(attempt, exam);
        var questions = await BuildQuestionsAsync(attemptId);
        var saved = await GetSavedAnswersAsync(attemptId);

        return ApiResponse<ExamAttemptTakingResponse>.SuccessResult(new ExamAttemptTakingResponse
        {
            AttemptId = attempt.Id, ExamId = attempt.ExamId,
            ExamName = exam?.Name ?? "", DurationMinutes = durationMinutes,
            StartedAt = AsUtc(attempt.StartedAt ?? DateTime.UtcNow),
            Status = attempt.Status ?? "", Questions = questions, SavedAnswers = saved
        });
    }

    // ─── Autosave ──────────────────────────────────────────────────────────────

    public async Task<ApiResponse<AutosaveAttemptResponse>> AutosaveAsync(
        int userId, int attemptId, AutosaveAttemptRequest request)
    {
        var attempt = await _attemptRepo.GetByIdAsync(attemptId);
        if (attempt is null || attempt.UserId != userId)
            return Fail<AutosaveAttemptResponse>("Không tìm thấy lần thi.");
        if (attempt.Status != AttemptStatus.InProgress)
            return Fail<AutosaveAttemptResponse>("Lần thi đã kết thúc, không thể lưu.");

        int savedCount = 0;
        foreach (var qa in request.Answers)
        {
            // Remove old answers for this question
            await _answerRepo.RemoveByAttemptAndQuestionAsync(attemptId, qa.QuestionId);
            // Add new
            if (qa.SelectedOptionIds.Count > 0)
            {
                var answers = qa.SelectedOptionIds.Select(oid => new AttemptAnswer
                {
                    AttemptId = attemptId, QuestionId = qa.QuestionId, AnswerOptionId = oid
                });
                await _answerRepo.AddRangeAsync(answers);
                savedCount += qa.SelectedOptionIds.Count;
            }
        }

        await _eventRepo.AddAsync(new AttemptEvent
        {
            AttemptId = attemptId, EventType = "Autosave",
            EventData = $"{{\"QuestionsUpdated\":{request.Answers.Count}}}",
            CreatedDate = DateTime.UtcNow
        });

        return ApiResponse<AutosaveAttemptResponse>.SuccessResult(new AutosaveAttemptResponse
        {
            AttemptId = attemptId, SavedCount = savedCount, SavedAt = DateTime.UtcNow
        }, "Lưu tự động thành công.");
    }

    // ─── Submit ────────────────────────────────────────────────────────────────

    public async Task<ApiResponse<SubmitAttemptResponse>> SubmitAsync(
        int userId, int attemptId, SubmitAttemptRequest request)
    {
        var attempt = await _attemptRepo.GetByIdAsync(attemptId);
        if (attempt is null || attempt.UserId != userId)
            return Fail<SubmitAttemptResponse>("Không tìm thấy lần thi.");

        // Idempotent: đã submit → trả result cũ
        if (attempt.Status is AttemptStatus.Submitted or AttemptStatus.AutoSubmitted)
        {
            return ApiResponse<SubmitAttemptResponse>.SuccessResult(new SubmitAttemptResponse
            {
                AttemptId = attempt.Id, Status = attempt.Status ?? AttemptStatus.Submitted,
                Score = attempt.Score, Passed = attempt.Passed, SubmittedAt = attempt.SubmittedAt
            }, "Bài thi đã được nộp trước đó.");
        }

        // Save final answers nếu có
        if (request.Answers is { Count: > 0 })
        {
            foreach (var qa in request.Answers)
            {
                await _answerRepo.RemoveByAttemptAndQuestionAsync(attemptId, qa.QuestionId);
                if (qa.SelectedOptionIds.Count > 0)
                {
                    await _answerRepo.AddRangeAsync(qa.SelectedOptionIds.Select(oid => new AttemptAnswer
                    {
                        AttemptId = attemptId, QuestionId = qa.QuestionId, AnswerOptionId = oid
                    }));
                }
            }
        }

        // Score
        var score = await CalculateScoreAsync(attemptId);
        var exam = await _examRepo.GetByIdAsync(attempt.ExamId);
        bool passed = exam != null && score >= exam.PassScore;

        attempt.Status = request.AutoSubmit ? AttemptStatus.AutoSubmitted : AttemptStatus.Submitted;
        attempt.SubmittedAt = DateTime.UtcNow;
        attempt.Score = score;
        attempt.Passed = passed;
        attempt.UpdateDate = DateTime.UtcNow;
        await _attemptRepo.UpdateAsync(attempt);

        await _eventRepo.AddAsync(new AttemptEvent
        {
            AttemptId = attemptId, EventType = request.AutoSubmit ? "AutoSubmit" : "Submit",
            EventData = $"{{\"Score\":{score},\"Passed\":{passed.ToString().ToLower()}}}",
            CreatedDate = DateTime.UtcNow
        });

        await _audit.LogActionAsync(userId, request.AutoSubmit ? "AUTO_SUBMIT_EXAM" : "SUBMIT_EXAM", "ExamAttempt", attempt.Id,
            null, $"{{\"Score\":{score},\"Passed\":{passed.ToString().ToLower()}}}");

        // Generate ExamResult + ExamResultDetail records
        await _resultService.GenerateResultAsync(attemptId);
        return ApiResponse<SubmitAttemptResponse>.SuccessResult(new SubmitAttemptResponse
        {
            AttemptId = attempt.Id, Status = attempt.Status,
            Score = score, Passed = passed, SubmittedAt = attempt.SubmittedAt
        }, "Nộp bài thi thành công.");
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    private async Task RepairAttemptRuntimeAsync(ExamAttempt attempt, Exam? exam, DateTime now)
    {
        var durationMinutes = ResolveDurationMinutes(attempt, exam);
        if (durationMinutes <= 0)
        {
            return;
        }

        var shouldResetStart = !attempt.StartedAt.HasValue
            || IsAttemptExpired(attempt, durationMinutes, now);
        var shouldUpdateDuration = !attempt.DurationMinutes.HasValue
            || attempt.DurationMinutes.Value <= 0;

        if (!shouldResetStart && !shouldUpdateDuration)
        {
            return;
        }

        if (shouldResetStart)
        {
            attempt.StartedAt = now;
        }

        if (shouldUpdateDuration)
        {
            attempt.DurationMinutes = durationMinutes;
        }

        attempt.UpdateDate = now;
        await _attemptRepo.UpdateAsync(attempt);
    }

    private static int ResolveDurationMinutes(ExamAttempt attempt, Exam? exam)
    {
        if (attempt.DurationMinutes.GetValueOrDefault() > 0)
        {
            return attempt.DurationMinutes!.Value;
        }

        return exam?.DurationMinutes > 0 ? exam.DurationMinutes : 0;
    }

    private static bool IsAttemptExpired(ExamAttempt attempt, int durationMinutes, DateTime now)
    {
        if (!attempt.StartedAt.HasValue || durationMinutes <= 0)
        {
            return false;
        }

        return attempt.StartedAt.Value.AddMinutes(durationMinutes) <= now;
    }

    private static DateTime AsUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    private async Task CreateSnapshotsAsync(int attemptId, Exam exam)
    {
        var examQuestions = await _examQuestionRepo.GetByExamIdAsync(exam.Id);
        var questionScore = CalculateScorePerQuestion(examQuestions.Count);

        var qSnapshots = new List<AttemptQuestionSnapshot>();
        var aSnapshots = new List<AttemptAnswerSnapshot>();

        foreach (var eq in examQuestions)
        {
            var q = await _questionRepo.GetByIdAsync(eq.QuestionId);
            if (q is null) continue;

            qSnapshots.Add(new AttemptQuestionSnapshot
            {
                AttemptId = attemptId, QuestionId = q.Id,
                Content = q.Content, QuestionType = q.QuestionType,
                Score = questionScore, Order = eq.Order
            });

            var options = await _answerOptionRepo.GetByQuestionIdAsync(q.Id);
            var optList = exam.RandomAnswer
                ? options.OrderBy(_ => Guid.NewGuid()).ToList()
                : options.OrderBy(o => o.Order).ToList();

            int order = 1;
            foreach (var o in optList)
            {
                aSnapshots.Add(new AttemptAnswerSnapshot
                {
                    AttemptId = attemptId, QuestionId = q.Id,
                    AnswerOptionId = o.Id, Content = o.Content,
                    IsCorrect = o.IsCorrect, Order = order++
                });
            }
        }

        if (qSnapshots.Count > 0) await _qsRepo.AddRangeAsync(qSnapshots);
        if (aSnapshots.Count > 0) await _asRepo.AddRangeAsync(aSnapshots);
    }

    private async Task<StartExamResponse> BuildStartResponseAsync(ExamAttempt attempt, Exam exam)
    {
        var questions = await BuildQuestionsAsync(attempt.Id);
        return new StartExamResponse
        {
            AttemptId = attempt.Id, ExamId = exam.Id, ExamName = exam.Name,
            DurationMinutes = ResolveDurationMinutes(attempt, exam),
            StartedAt = AsUtc(attempt.StartedAt ?? DateTime.UtcNow),
            Questions = questions
        };
    }

    private async Task<List<AttemptQuestionResponse>> BuildQuestionsAsync(int attemptId)
    {
        var qSnaps = await _qsRepo.GetByAttemptIdAsync(attemptId);
        var questionScore = CalculateScorePerQuestion(qSnaps.Count);
        var result = new List<AttemptQuestionResponse>(qSnaps.Count);
        foreach (var qs in qSnaps)
        {
            var aSnaps = await _asRepo.GetByAttemptAndQuestionAsync(attemptId, qs.QuestionId);
            result.Add(new AttemptQuestionResponse
            {
                QuestionId = qs.QuestionId, Content = qs.Content,
                QuestionType = qs.QuestionType, Score = questionScore, Order = qs.Order,
                Options = aSnaps.Select(a => new AttemptAnswerOptionResponse
                {
                    AnswerOptionId = a.AnswerOptionId, Content = a.Content, Order = a.Order
                }).ToList()
            });
        }
        return result;
    }

    private async Task<List<QuestionAnswerDto>> GetSavedAnswersAsync(int attemptId)
    {
        var allAnswers = await _answerRepo.GetByAttemptIdAsync(attemptId);
        return allAnswers.GroupBy(a => a.QuestionId)
            .Select(g => new QuestionAnswerDto
            {
                QuestionId = g.Key,
                SelectedOptionIds = g.Select(a => a.AnswerOptionId).ToList()
            }).ToList();
    }

    /// <summary>
    /// Scoring dựa trên snapshot (không dùng live question bank).
    /// SingleChoice: đúng khi selected = set correct duy nhất.
    /// MultipleChoice: đúng khi set selected == set correct.
    /// Mỗi câu có trọng số bằng nhau: 100 / số lượng câu hỏi.
    /// </summary>
    private async Task<decimal> CalculateScoreAsync(int attemptId)
    {
        var qSnaps = await _qsRepo.GetByAttemptIdAsync(attemptId);
        var allASnaps = await _asRepo.GetByAttemptIdAsync(attemptId);
        var allAnswers = await _answerRepo.GetByAttemptIdAsync(attemptId);

        var correctCount = 0;

        foreach (var qs in qSnaps)
        {
            // Correct option ids from snapshot
            var correctIds = allASnaps
                .Where(a => a.QuestionId == qs.QuestionId && a.IsCorrect)
                .Select(a => a.AnswerOptionId)
                .ToHashSet();

            // Student selected option ids
            var selectedIds = allAnswers
                .Where(a => a.QuestionId == qs.QuestionId)
                .Select(a => a.AnswerOptionId)
                .ToHashSet();

            // Compare sets
            if (correctIds.SetEquals(selectedIds))
                correctCount++;
        }

        return CalculateTotalScore(correctCount, qSnaps.Count);
    }

    private static decimal CalculateScorePerQuestion(int questionCount)
    {
        return questionCount <= 0
            ? 0m
            : Math.Round(100m / questionCount, 2, MidpointRounding.AwayFromZero);
    }

    private static decimal CalculateTotalScore(int correctCount, int questionCount)
    {
        return questionCount <= 0
            ? 0m
            : Math.Round(correctCount * 100m / questionCount, 2, MidpointRounding.AwayFromZero);
    }

    private static ApiResponse<T> Fail<T>(string msg) => ApiResponse<T>.FailureResult(msg);
}
