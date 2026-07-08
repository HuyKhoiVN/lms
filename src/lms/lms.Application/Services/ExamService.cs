using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Exams;
using lms.Application.DTOs.Questions;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

/// <summary>
/// Business rules theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 8:
/// - DurationMinutes > 0, PassScore >= 0.
/// - Publish: phải có manual question hoặc valid random rule.
/// - Không sửa exam đã có attempt (future-proof check — attempt repo sẽ inject ở Phase 6).
/// - ReviewMode phải thuộc ExamReviewMode constants.
/// - Code unique nếu có.
/// </summary>
public sealed class ExamService : IExamService
{
    private readonly IExamRepository _examRepo;
    private readonly IExamQuestionRepository _examQuestionRepo;
    private readonly IExamRandomRuleRepository _randomRuleRepo;
    private readonly IQuestionRepository _questionRepo;
    private readonly IQuestionCategoryRepository _categoryRepo;
    private readonly IExamAttemptRepository _attemptRepo;
    private readonly IAuditLogService _audit;

    public ExamService(
        IExamRepository examRepo,
        IExamQuestionRepository examQuestionRepo,
        IExamRandomRuleRepository randomRuleRepo,
        IQuestionRepository questionRepo,
        IQuestionCategoryRepository categoryRepo,
        IExamAttemptRepository attemptRepo,
        IAuditLogService audit)
    {
        _examRepo = examRepo;
        _examQuestionRepo = examQuestionRepo;
        _randomRuleRepo = randomRuleRepo;
        _questionRepo = questionRepo;
        _categoryRepo = categoryRepo;
        _attemptRepo = attemptRepo;
        _audit = audit;
    }

    // ─── Query ─────────────────────────────────────────────────────────────────

    public async Task<ApiResponse<PagedResult<ExamListItemResponse>>> GetPagedAsync(
        ExamFilterRequest filter, int? studentUserId)
    {
        var page = filter.Page < 1 ? 1 : filter.Page;
        var size = filter.PageSize is < 1 or > 200 ? 20 : filter.PageSize;

        List<Exam> exams;
        int total;

        if (studentUserId.HasValue)
        {
            exams = await _examRepo.GetPagedForStudentAsync(studentUserId.Value, filter.Keyword, page, size);
            total = await _examRepo.GetCountForStudentAsync(studentUserId.Value, filter.Keyword);
        }
        else
        {
            exams = await _examRepo.GetPagedAsync(filter.Keyword, filter.IsPublished, page, size);
            total = await _examRepo.GetCountAsync(filter.Keyword, filter.IsPublished);
        }

        var items = new List<ExamListItemResponse>(exams.Count);
        foreach (var e in exams)
        {
            var qCount = await _examQuestionRepo.GetCountByExamIdAsync(e.Id);
            var attemptStats = await GetAttemptStatsAsync(e, studentUserId);
            items.Add(new ExamListItemResponse
            {
                Id = e.Id, Code = e.Code, Name = e.Name,
                DurationMinutes = e.DurationMinutes, PassScore = e.PassScore,
                AttemptLimit = e.AttemptLimit, IsPublished = e.IsPublished,
                UsedAttemptCount = attemptStats.UsedCount,
                RemainingAttemptCount = attemptStats.RemainingCount,
                CanStart = attemptStats.CanStart,
                HasActiveAttempt = attemptStats.HasActiveAttempt,
                ReviewMode = e.ReviewMode, QuestionCount = qCount
            });
        }

        return ApiResponse<PagedResult<ExamListItemResponse>>.SuccessResult(
            new PagedResult<ExamListItemResponse>(items, total, page, size));
    }

    public async Task<ApiResponse<ExamDetailResponse>> GetByIdAsync(int id, int? studentUserId = null)
    {
        var exam = await _examRepo.GetByIdAsync(id);
        if (exam is null) return ApiResponse<ExamDetailResponse>.FailureResult("Không tìm thấy bài thi.");
        return ApiResponse<ExamDetailResponse>.SuccessResult(await BuildDetailAsync(exam, studentUserId));
    }

    // ─── CRUD ──────────────────────────────────────────────────────────────────

    public async Task<ApiResponse<ExamDetailResponse>> CreateAsync(CreateExamRequest request, int? adminId)
    {
        var err = ValidateExamRequest(request.DurationMinutes, request.PassScore, request.ReviewMode);
        if (err != null) return ApiResponse<ExamDetailResponse>.FailureResult(err);

        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var dup = await _examRepo.GetByCodeAsync(request.Code);
            if (dup != null) return ApiResponse<ExamDetailResponse>.FailureResult($"Mã bài thi '{request.Code}' đã tồn tại.");
        }

        var exam = new Exam
        {
            Code = request.Code, Name = request.Name, Description = request.Description,
            DurationMinutes = request.DurationMinutes, PassScore = request.PassScore,
            AttemptLimit = request.AttemptLimit, RandomQuestion = request.RandomQuestion,
            RandomAnswer = request.RandomAnswer,
            ReviewMode = string.IsNullOrWhiteSpace(request.ReviewMode) ? ExamReviewMode.ResultOnly : request.ReviewMode,
            IsPublished = false, IsDelete = false,
            CreatedDate = DateTime.UtcNow, CreatedBy = adminId
        };

        await _examRepo.AddAsync(exam);
        await _audit.LogActionAsync(adminId, "CREATE", "Exam", exam.Id,
            null, $"{{\"Name\":\"{exam.Name}\",\"Code\":\"{exam.Code}\"}}");

        return ApiResponse<ExamDetailResponse>.SuccessResult(await BuildDetailAsync(exam), "Tạo bài thi thành công.");
    }

    public async Task<ApiResponse<ExamDetailResponse>> UpdateAsync(int id, UpdateExamRequest request, int? adminId)
    {
        var exam = await _examRepo.GetByIdAsync(id);
        if (exam is null) return ApiResponse<ExamDetailResponse>.FailureResult("Không tìm thấy bài thi.");

        var err = ValidateExamRequest(request.DurationMinutes, request.PassScore, request.ReviewMode);
        if (err != null) return ApiResponse<ExamDetailResponse>.FailureResult(err);

        if (!string.IsNullOrWhiteSpace(request.Code) &&
            !string.Equals(exam.Code, request.Code, StringComparison.OrdinalIgnoreCase))
        {
            var dup = await _examRepo.GetByCodeAsync(request.Code);
            if (dup != null) return ApiResponse<ExamDetailResponse>.FailureResult($"Mã bài thi '{request.Code}' đã tồn tại.");
        }

        var before = $"{{\"Name\":\"{exam.Name}\",\"IsPublished\":{exam.IsPublished.ToString().ToLower()}}}";
        exam.Code = request.Code; exam.Name = request.Name; exam.Description = request.Description;
        exam.DurationMinutes = request.DurationMinutes; exam.PassScore = request.PassScore;
        exam.AttemptLimit = request.AttemptLimit; exam.RandomQuestion = request.RandomQuestion;
        exam.RandomAnswer = request.RandomAnswer;
        exam.ReviewMode = string.IsNullOrWhiteSpace(request.ReviewMode) ? ExamReviewMode.ResultOnly : request.ReviewMode;
        exam.UpdateDate = DateTime.UtcNow; exam.UpdatedBy = adminId;

        await _examRepo.UpdateAsync(exam);
        await _audit.LogActionAsync(adminId, "UPDATE", "Exam", exam.Id,
            before, $"{{\"Name\":\"{exam.Name}\"}}");

        return ApiResponse<ExamDetailResponse>.SuccessResult(await BuildDetailAsync(exam), "Cập nhật bài thi thành công.");
    }

    public async Task<ApiResponse<object>> DeleteAsync(int id, int? adminId)
    {
        var exam = await _examRepo.GetByIdAsync(id);
        if (exam is null) return ApiResponse<object>.FailureResult("Không tìm thấy bài thi.");

        exam.IsDelete = true; exam.UpdateDate = DateTime.UtcNow; exam.UpdatedBy = adminId;
        await _examRepo.UpdateAsync(exam);
        await _audit.LogActionAsync(adminId, "DELETE", "Exam", exam.Id,
            $"{{\"Name\":\"{exam.Name}\"}}", null);

        return ApiResponse<object>.SuccessResult(null!, "Xóa bài thi thành công.");
    }

    // ─── Question management ───────────────────────────────────────────────────

    public async Task<ApiResponse<ExamDetailResponse>> AddQuestionAsync(int examId, AddExamQuestionRequest request, int? adminId)
    {
        var exam = await _examRepo.GetByIdAsync(examId);
        if (exam is null) return ApiResponse<ExamDetailResponse>.FailureResult("Không tìm thấy bài thi.");

        var question = await _questionRepo.GetByIdAsync(request.QuestionId);
        if (question is null) return ApiResponse<ExamDetailResponse>.FailureResult("Không tìm thấy câu hỏi.");

        var dup = await _examQuestionRepo.GetByExamAndQuestionAsync(examId, request.QuestionId);
        if (dup != null) return ApiResponse<ExamDetailResponse>.FailureResult("Câu hỏi đã có trong bài thi.");

        var eq = new ExamQuestion
        {
            ExamId = examId, QuestionId = request.QuestionId,
            Score = request.ScoreOverride ?? question.Score,
            Order = request.Order
        };

        await _examQuestionRepo.AddAsync(eq);
        await _audit.LogActionAsync(adminId, "ASSIGN", "ExamQuestion", examId,
            null, $"{{\"QuestionId\":{request.QuestionId}}}");

        return ApiResponse<ExamDetailResponse>.SuccessResult(await BuildDetailAsync(exam), "Thêm câu hỏi thành công.");
    }

    public async Task<ApiResponse<object>> RemoveQuestionAsync(int examId, int questionId, int? adminId)
    {
        var eq = await _examQuestionRepo.GetByExamAndQuestionAsync(examId, questionId);
        if (eq is null) return ApiResponse<object>.FailureResult("Không tìm thấy câu hỏi trong bài thi.");

        await _examQuestionRepo.RemoveAsync(eq);
        await _audit.LogActionAsync(adminId, "REMOVE_ASSIGNMENT", "ExamQuestion", examId,
            $"{{\"QuestionId\":{questionId}}}", null);

        return ApiResponse<object>.SuccessResult(null!, "Xóa câu hỏi khỏi bài thi thành công.");
    }

    // ─── Random rules ──────────────────────────────────────────────────────────

    public async Task<ApiResponse<ExamDetailResponse>> SaveRandomRulesAsync(int examId, SaveExamRandomRulesRequest request, int? adminId)
    {
        var exam = await _examRepo.GetByIdAsync(examId);
        if (exam is null) return ApiResponse<ExamDetailResponse>.FailureResult("Không tìm thấy bài thi.");

        // Validate rules
        foreach (var r in request.Rules)
        {
            if (r.QuestionCount <= 0)
                return ApiResponse<ExamDetailResponse>.FailureResult("QuestionCount phải > 0.");
            if (r.ScorePerQuestion < 0)
                return ApiResponse<ExamDetailResponse>.FailureResult("ScorePerQuestion không được âm.");
            if (!string.IsNullOrWhiteSpace(r.Difficulty) && !QuestionDifficulty.All.Contains(r.Difficulty))
                return ApiResponse<ExamDetailResponse>.FailureResult($"Difficulty không hợp lệ: {r.Difficulty}.");
            if (r.CategoryId.HasValue)
            {
                var cat = await _categoryRepo.GetByIdAsync(r.CategoryId.Value);
                if (cat is null) return ApiResponse<ExamDetailResponse>.FailureResult($"Không tìm thấy danh mục {r.CategoryId.Value}.");
            }
        }

        // Replace all rules
        await _randomRuleRepo.RemoveByExamIdAsync(examId);
        if (request.Rules.Count > 0)
        {
            var newRules = request.Rules.Select(r => new ExamRandomRule
            {
                ExamId = examId, CategoryId = r.CategoryId,
                Difficulty = r.Difficulty, QuestionCount = r.QuestionCount,
                ScorePerQuestion = r.ScorePerQuestion,
                CreatedDate = DateTime.UtcNow, CreatedBy = adminId
            }).ToList();
            await _randomRuleRepo.AddRangeAsync(newRules);
        }

        await _audit.LogActionAsync(adminId, "UPDATE", "ExamRandomRules", examId,
            null, $"{{\"RuleCount\":{request.Rules.Count}}}");

        return ApiResponse<ExamDetailResponse>.SuccessResult(await BuildDetailAsync(exam), "Lưu random rules thành công.");
    }

    // ─── Publish ───────────────────────────────────────────────────────────────

    public async Task<ApiResponse<object>> PublishAsync(int id, bool publish, int? adminId)
    {
        var exam = await _examRepo.GetByIdAsync(id);
        if (exam is null) return ApiResponse<object>.FailureResult("Không tìm thấy bài thi.");

        if (publish)
        {
            // Validate: phải có câu hỏi manual hoặc random rule
            var manualCount = await _examQuestionRepo.GetCountByExamIdAsync(id);
            var randomRules = await _randomRuleRepo.GetByExamIdAsync(id);
            bool hasRandomRules = randomRules.Any(r => r.QuestionCount > 0);

            if (manualCount == 0 && !hasRandomRules)
                return ApiResponse<object>.FailureResult(
                    "Không thể publish: bài thi phải có ít nhất 1 câu hỏi (manual hoặc random rule).");

            if (exam.DurationMinutes <= 0)
                return ApiResponse<object>.FailureResult("Không thể publish: DurationMinutes phải > 0.");

            if (exam.PassScore < 0)
                return ApiResponse<object>.FailureResult("Không thể publish: PassScore không được âm.");
        }

        var before = $"{{\"IsPublished\":{exam.IsPublished.ToString().ToLower()}}}";
        exam.IsPublished = publish;
        exam.UpdateDate = DateTime.UtcNow; exam.UpdatedBy = adminId;
        await _examRepo.UpdateAsync(exam);

        var action = publish ? "PUBLISH" : "UNPUBLISH";
        await _audit.LogActionAsync(adminId, action, "Exam", exam.Id,
            before, $"{{\"IsPublished\":{publish.ToString().ToLower()}}}");

        return ApiResponse<object>.SuccessResult(null!,
            publish ? "Publish bài thi thành công." : "Unpublish bài thi thành công.");
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    private static string? ValidateExamRequest(int duration, decimal passScore, string? reviewMode)
    {
        if (duration <= 0) return "DurationMinutes phải > 0.";
        if (passScore < 0) return "PassScore không được âm.";
        if (!string.IsNullOrWhiteSpace(reviewMode) && !ExamReviewMode.All.Contains(reviewMode))
            return $"ReviewMode không hợp lệ. Chấp nhận: {string.Join(", ", ExamReviewMode.All)}.";
        return null;
    }

    private static string GetReviewPolicy(string? reviewMode)
    {
        return reviewMode switch
        {
            ExamReviewMode.FullReview => "Xem toàn bộ sau khi nộp",
            ExamReviewMode.AnswerOnly => "Xem đáp án sau khi nộp",
            ExamReviewMode.NoReview => "Không cho xem lại",
            _ => "Chỉ xem kết quả sau khi nộp"
        };
    }

    private static string GetStatus(Exam exam)
    {
        return exam.IsPublished ? "Sẵn sàng" : "Bản nháp";
    }

    private static List<ExamInstructionResponse> BuildInstructions()
    {
        return new List<ExamInstructionResponse>
        {
            new() { Number = "01", Icon = "book-open", Title = "Đọc hướng dẫn", Description = "Xem phạm vi bài thi và quy định trước khi bắt đầu." },
            new() { Number = "02", Icon = "monitor", Title = "Chuẩn bị thiết bị", Description = "Sử dụng thiết bị, trình duyệt và kết nối internet ổn định." },
            new() { Number = "03", Icon = "play", Title = "Bắt đầu làm bài", Description = "Thời gian sẽ được tính ngay khi bạn bắt đầu." },
            new() { Number = "04", Icon = "send", Title = "Nộp câu trả lời", Description = "Nộp bài trước khi đồng hồ đếm ngược kết thúc." },
            new() { Number = "05", Icon = "eye", Title = "Xem kết quả", Description = "Quyền xem lại phụ thuộc vào chính sách của bài thi." }
        };
    }

    private static List<ExamRuleResponse> BuildExamRules(Exam exam)
    {
        return new List<ExamRuleResponse>
        {
            new() { Icon = "refresh-cw-off", Title = "Không tải lại trang", Description = "Không tải lại hoặc đóng trình duyệt trong khi làm bài." },
            new() { Icon = "wifi", Title = "Internet ổn định", Description = "Giữ kết nối internet ổn định cho đến khi nộp bài." },
            new() { Icon = "timer", Title = "Thời gian bắt đầu ngay", Description = $"Đồng hồ {exam.DurationMinutes} phút bắt đầu sau khi bấm Start Exam." },
            new() { Icon = "send", Title = "Nộp trước khi hết giờ", Description = "Nộp câu trả lời trước khi đồng hồ kết thúc." },
            new() { Icon = "eye", Title = "Chính sách xem lại", Description = GetReviewPolicy(exam.ReviewMode) + "." },
            new() { Icon = "shield-alert", Title = "Ghi nhận chống gian lận", Description = "Hoạt động bất thường trong bài thi có thể được ghi nhận để kiểm tra." }
        };
    }

    private async Task<ExamAttemptStats> GetAttemptStatsAsync(Exam exam, int? studentUserId)
    {
        if (!studentUserId.HasValue)
        {
            return new ExamAttemptStats(0, exam.AttemptLimit, exam.IsPublished, false);
        }

        var usedCount = await _attemptRepo.GetAttemptCountAsync(studentUserId.Value, exam.Id);
        var active = await _attemptRepo.GetActiveByUserAndExamAsync(studentUserId.Value, exam.Id);
        int? remainingCount = exam.AttemptLimit.HasValue
            ? Math.Max(exam.AttemptLimit.Value - usedCount, 0)
            : null;
        var canStart = exam.IsPublished
            && (active is not null || !exam.AttemptLimit.HasValue || usedCount < exam.AttemptLimit.Value);

        return new ExamAttemptStats(usedCount, remainingCount, canStart, active is not null);
    }

    private async Task<ExamDetailResponse> BuildDetailAsync(Exam e, int? studentUserId = null)
    {
        var examQuestions = await _examQuestionRepo.GetByExamIdAsync(e.Id);
        var randomRules = await _randomRuleRepo.GetByExamIdAsync(e.Id);
        var questionCount = examQuestions.Count + randomRules.Sum(r => r.QuestionCount);
        var reviewPolicy = GetReviewPolicy(e.ReviewMode);
        var attemptStats = await GetAttemptStatsAsync(e, studentUserId);

        var qResponses = new List<ExamQuestionResponse>(examQuestions.Count);
        foreach (var eq in examQuestions)
        {
            var q = await _questionRepo.GetByIdAsync(eq.QuestionId);
            qResponses.Add(new ExamQuestionResponse
            {
                Id = eq.Id, QuestionId = eq.QuestionId,
                QuestionContent = q?.Content, QuestionType = q?.QuestionType,
                Difficulty = q?.Difficulty, Score = eq.Score, Order = eq.Order
            });
        }

        return new ExamDetailResponse
        {
            Id = e.Id, Code = e.Code, Name = e.Name, Description = e.Description,
            DurationMinutes = e.DurationMinutes, PassScore = e.PassScore,
            AttemptLimit = e.AttemptLimit, RandomQuestion = e.RandomQuestion,
            RandomAnswer = e.RandomAnswer, ReviewMode = e.ReviewMode,
            IsPublished = e.IsPublished, Status = GetStatus(e),
            QuestionCount = questionCount,
            AttemptCount = e.AttemptLimit ?? 1,
            UsedAttemptCount = attemptStats.UsedCount,
            RemainingAttemptCount = attemptStats.RemainingCount,
            CanStart = attemptStats.CanStart,
            HasActiveAttempt = attemptStats.HasActiveAttempt,
            ReviewPolicy = reviewPolicy,
            Language = "Tiếng Việt",
            CreatedDate = e.CreatedDate,
            Questions = qResponses,
            RandomRules = randomRules.Select(r => new ExamRandomRuleResponse
            {
                Id = r.Id, CategoryId = r.CategoryId, Difficulty = r.Difficulty,
                QuestionCount = r.QuestionCount, ScorePerQuestion = r.ScorePerQuestion
            }).ToList(),
            Instructions = BuildInstructions(),
            ExamRules = BuildExamRules(e)
        };
    }

    private sealed record ExamAttemptStats(
        int UsedCount,
        int? RemainingCount,
        bool CanStart,
        bool HasActiveAttempt);
}
