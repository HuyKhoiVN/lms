using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Questions;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

/// <summary>
/// Business rules theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 7:
/// - SingleChoice: đúng 1 IsCorrect = true.
/// - MultipleChoice: ≥ 1 IsCorrect = true.
/// - Tối thiểu 2 answer options cho choice question.
/// - Không expose IsCorrect cho Student (caller phải tự filter; controller Admin-only).
/// - Update dùng replace strategy: xóa answer cũ → thêm answer mới.
/// - Không thay đổi QuestionType sau khi tạo.
/// - Soft delete: không thay đổi ExamAttempt / snapshot history.
/// </summary>
public sealed class QuestionService : IQuestionService
{
    private readonly IQuestionRepository _questionRepo;
    private readonly IAnswerOptionRepository _answerRepo;
    private readonly IQuestionCategoryRepository _categoryRepo;
    private readonly IAuditLogService _audit;

    public QuestionService(
        IQuestionRepository questionRepo,
        IAnswerOptionRepository answerRepo,
        IQuestionCategoryRepository categoryRepo,
        IAuditLogService audit)
    {
        _questionRepo = questionRepo;
        _answerRepo = answerRepo;
        _categoryRepo = categoryRepo;
        _audit = audit;
    }

    public async Task<ApiResponse<PagedResult<QuestionListItemResponse>>> GetPagedAsync(QuestionFilterRequest filter)
    {
        var page = filter.Page < 1 ? 1 : filter.Page;
        var size = filter.PageSize is < 1 or > 200 ? 20 : filter.PageSize;

        var questions = await _questionRepo.GetPagedAsync(
            filter.CategoryId, filter.Keyword, filter.Difficulty, filter.QuestionType, page, size);
        var total = await _questionRepo.GetCountAsync(
            filter.CategoryId, filter.Keyword, filter.Difficulty, filter.QuestionType);

        var items = new List<QuestionListItemResponse>(questions.Count);
        foreach (var q in questions)
        {
            var opts = await _answerRepo.GetByQuestionIdAsync(q.Id);
            var cat = await _categoryRepo.GetByIdAsync(q.CategoryId);
            items.Add(new QuestionListItemResponse
            {
                Id = q.Id,
                CategoryId = q.CategoryId,
                CategoryName = cat?.Name,
                Content = q.Content,
                QuestionType = q.QuestionType,
                Difficulty = q.Difficulty,
                Score = q.Score,
                AnswerCount = opts.Count
            });
        }

        return ApiResponse<PagedResult<QuestionListItemResponse>>.SuccessResult(
            new PagedResult<QuestionListItemResponse>(items, total, page, size));
    }

    public async Task<ApiResponse<QuestionDetailResponse>> GetByIdAsync(int id)
    {
        var q = await _questionRepo.GetByIdAsync(id);
        if (q is null)
            return ApiResponse<QuestionDetailResponse>.FailureResult("Không tìm thấy câu hỏi.");

        return ApiResponse<QuestionDetailResponse>.SuccessResult(await BuildDetailAsync(q));
    }

    public async Task<ApiResponse<QuestionDetailResponse>> CreateAsync(CreateQuestionRequest request, int? adminId)
    {
        // Validate QuestionType
        if (!QuestionType.All.Contains(request.QuestionType))
            return ApiResponse<QuestionDetailResponse>.FailureResult(
                $"QuestionType không hợp lệ. Chấp nhận: {string.Join(", ", QuestionType.All)}.");

        // Validate Difficulty
        if (!QuestionDifficulty.All.Contains(request.Difficulty))
            return ApiResponse<QuestionDetailResponse>.FailureResult(
                $"Difficulty không hợp lệ. Chấp nhận: {string.Join(", ", QuestionDifficulty.All)}.");

        // Validate answer options
        var validationError = ValidateAnswerOptions(request.QuestionType, request.AnswerOptions);
        if (validationError != null)
            return ApiResponse<QuestionDetailResponse>.FailureResult(validationError);

        // Validate category tồn tại (service-level, không FK)
        var cat = await _categoryRepo.GetByIdAsync(request.CategoryId);
        if (cat is null)
            return ApiResponse<QuestionDetailResponse>.FailureResult("Không tìm thấy danh mục câu hỏi.");

        var question = new Question
        {
            CategoryId = request.CategoryId,
            Content = request.Content,
            QuestionType = request.QuestionType,
            Difficulty = request.Difficulty,
            Score = request.Score,
            Order = request.Order,
            IsDelete = false,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = adminId
        };

        await _questionRepo.AddAsync(question);

        // Thêm answer options
        var options = request.AnswerOptions.Select((o, i) => new AnswerOption
        {
            QuestionId = question.Id,
            Content = o.Content,
            IsCorrect = o.IsCorrect,
            Order = o.Order == 0 ? i + 1 : o.Order,
            IsDelete = false,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = adminId
        }).ToList();

        await _answerRepo.AddRangeAsync(options);

        await _audit.LogActionAsync(adminId, "CREATE", "Question", question.Id,
            null, $"{{\"CategoryId\":{question.CategoryId},\"Type\":\"{question.QuestionType}\",\"Difficulty\":\"{question.Difficulty}\"}}");

        return ApiResponse<QuestionDetailResponse>.SuccessResult(
            await BuildDetailAsync(question), "Tạo câu hỏi thành công.");
    }

    public async Task<ApiResponse<QuestionDetailResponse>> UpdateAsync(int id, UpdateQuestionRequest request, int? adminId)
    {
        var question = await _questionRepo.GetByIdAsync(id);
        if (question is null)
            return ApiResponse<QuestionDetailResponse>.FailureResult("Không tìm thấy câu hỏi.");

        // Validate difficulty
        if (!QuestionDifficulty.All.Contains(request.Difficulty))
            return ApiResponse<QuestionDetailResponse>.FailureResult(
                $"Difficulty không hợp lệ. Chấp nhận: {string.Join(", ", QuestionDifficulty.All)}.");

        // Validate answer options (giữ nguyên QuestionType)
        var validationError = ValidateAnswerOptions(question.QuestionType, request.AnswerOptions);
        if (validationError != null)
            return ApiResponse<QuestionDetailResponse>.FailureResult(validationError);

        // Validate category
        var cat = await _categoryRepo.GetByIdAsync(request.CategoryId);
        if (cat is null)
            return ApiResponse<QuestionDetailResponse>.FailureResult("Không tìm thấy danh mục câu hỏi.");

        var before = $"{{\"Content\":\"{question.Content[..Math.Min(50, question.Content.Length)]}\",\"Difficulty\":\"{question.Difficulty}\"}}";

        question.CategoryId = request.CategoryId;
        question.Content = request.Content;
        question.Difficulty = request.Difficulty;
        question.Score = request.Score;
        question.Order = request.Order;
        question.UpdateDate = DateTime.UtcNow;
        question.UpdatedBy = adminId;

        await _questionRepo.UpdateAsync(question);

        // Replace strategy: xóa answer cũ → thêm mới
        await _answerRepo.RemoveByQuestionIdAsync(question.Id);
        var newOptions = request.AnswerOptions.Select((o, i) => new AnswerOption
        {
            QuestionId = question.Id,
            Content = o.Content,
            IsCorrect = o.IsCorrect,
            Order = o.Order == 0 ? i + 1 : o.Order,
            IsDelete = false,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = adminId
        }).ToList();
        await _answerRepo.AddRangeAsync(newOptions);

        await _audit.LogActionAsync(adminId, "UPDATE", "Question", question.Id,
            before, $"{{\"Difficulty\":\"{question.Difficulty}\",\"Score\":{question.Score}}}");

        return ApiResponse<QuestionDetailResponse>.SuccessResult(
            await BuildDetailAsync(question), "Cập nhật câu hỏi thành công.");
    }

    public async Task<ApiResponse<object>> DeleteAsync(int id, int? adminId)
    {
        var question = await _questionRepo.GetByIdAsync(id);
        if (question is null)
            return ApiResponse<object>.FailureResult("Không tìm thấy câu hỏi.");

        question.IsDelete = true;
        question.UpdateDate = DateTime.UtcNow;
        question.UpdatedBy = adminId;

        await _questionRepo.UpdateAsync(question);

        await _audit.LogActionAsync(adminId, "DELETE", "Question", question.Id,
            $"{{\"CategoryId\":{question.CategoryId},\"Type\":\"{question.QuestionType}\"}}", null);

        return ApiResponse<object>.SuccessResult(null!, "Xóa câu hỏi thành công.");
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    private static string? ValidateAnswerOptions(string questionType, List<AnswerOptionRequest> options)
    {
        if (options is null || options.Count < 2)
            return "Câu hỏi dạng lựa chọn phải có ít nhất 2 đáp án.";

        var correctCount = options.Count(o => o.IsCorrect);

        if (questionType == QuestionType.SingleChoice && correctCount != 1)
            return "Câu hỏi SingleChoice phải có đúng 1 đáp án đúng.";

        if (questionType == QuestionType.MultipleChoice && correctCount < 1)
            return "Câu hỏi MultipleChoice phải có ít nhất 1 đáp án đúng.";

        return null;
    }

    private async Task<QuestionDetailResponse> BuildDetailAsync(Question q)
    {
        var opts = await _answerRepo.GetByQuestionIdAsync(q.Id);
        var cat = await _categoryRepo.GetByIdAsync(q.CategoryId);

        return new QuestionDetailResponse
        {
            Id = q.Id,
            CategoryId = q.CategoryId,
            CategoryName = cat?.Name,
            Content = q.Content,
            QuestionType = q.QuestionType,
            Difficulty = q.Difficulty,
            Score = q.Score,
            Order = q.Order,
            CreatedDate = q.CreatedDate,
            AnswerOptions = opts.Select(o => new AnswerOptionAdminResponse
            {
                Id = o.Id,
                Content = o.Content,
                IsCorrect = o.IsCorrect,
                Order = o.Order
            }).ToList()
        };
    }
}
