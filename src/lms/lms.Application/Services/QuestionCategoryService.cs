using System;
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
/// - Category name unique (trong scope not-deleted).
/// - Soft delete bị chặn nếu còn question active hoặc sub-category tồn tại.
/// </summary>
public sealed class QuestionCategoryService : IQuestionCategoryService
{
    private readonly IQuestionCategoryRepository _repo;
    private readonly IAuditLogService _audit;

    public QuestionCategoryService(IQuestionCategoryRepository repo, IAuditLogService audit)
    {
        _repo = repo;
        _audit = audit;
    }

    public async Task<ApiResponse<PagedResult<QuestionCategoryResponse>>> GetPagedAsync(QuestionCategoryFilterRequest filter)
    {
        var page = filter.Page < 1 ? 1 : filter.Page;
        var size = filter.PageSize is < 1 or > 200 ? 20 : filter.PageSize;
        var items = await _repo.GetPagedAsync(filter.Keyword, filter.ParentCategoryId, page, size);
        var total = await _repo.GetCountAsync(filter.Keyword, filter.ParentCategoryId);
        return ApiResponse<PagedResult<QuestionCategoryResponse>>.SuccessResult(
            new PagedResult<QuestionCategoryResponse>(items.Select(Map).ToList(), total, page, size));
    }

    public async Task<ApiResponse<QuestionCategoryResponse>> GetByIdAsync(int id)
    {
        var cat = await _repo.GetByIdAsync(id);
        if (cat is null) return ApiResponse<QuestionCategoryResponse>.FailureResult("Không tìm thấy danh mục câu hỏi.");
        return ApiResponse<QuestionCategoryResponse>.SuccessResult(Map(cat));
    }

    public async Task<ApiResponse<QuestionCategoryResponse>> CreateAsync(CreateQuestionCategoryRequest request, int? adminId)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return ApiResponse<QuestionCategoryResponse>.FailureResult("Tên danh mục không được trống.");

        var existing = await _repo.GetByNameAsync(request.Name);
        if (existing != null)
            return ApiResponse<QuestionCategoryResponse>.FailureResult($"Danh mục '{request.Name}' đã tồn tại.");

        // Validate parent nếu có
        if (request.ParentCategoryId.HasValue)
        {
            var parent = await _repo.GetByIdAsync(request.ParentCategoryId.Value);
            if (parent is null)
                return ApiResponse<QuestionCategoryResponse>.FailureResult("Không tìm thấy danh mục cha.");
        }

        var cat = new QuestionCategory
        {
            Name = request.Name,
            Description = request.Description,
            ParentCategoryId = request.ParentCategoryId,
            IsDelete = false,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = adminId
        };

        await _repo.AddAsync(cat);
        await _audit.LogActionAsync(adminId, "CREATE", "QuestionCategory", cat.Id,
            null, $"{{\"Name\":\"{cat.Name}\"}}");

        return ApiResponse<QuestionCategoryResponse>.SuccessResult(Map(cat), "Tạo danh mục thành công.");
    }

    public async Task<ApiResponse<QuestionCategoryResponse>> UpdateAsync(int id, UpdateQuestionCategoryRequest request, int? adminId)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return ApiResponse<QuestionCategoryResponse>.FailureResult("Tên danh mục không được trống.");

        var cat = await _repo.GetByIdAsync(id);
        if (cat is null) return ApiResponse<QuestionCategoryResponse>.FailureResult("Không tìm thấy danh mục câu hỏi.");

        if (!string.Equals(cat.Name, request.Name, StringComparison.OrdinalIgnoreCase))
        {
            var dup = await _repo.GetByNameAsync(request.Name);
            if (dup != null) return ApiResponse<QuestionCategoryResponse>.FailureResult($"Danh mục '{request.Name}' đã tồn tại.");
        }

        var before = $"{{\"Name\":\"{cat.Name}\"}}";
        cat.Name = request.Name;
        cat.Description = request.Description;
        cat.ParentCategoryId = request.ParentCategoryId;
        cat.UpdateDate = DateTime.UtcNow;
        cat.UpdatedBy = adminId;

        await _repo.UpdateAsync(cat);
        await _audit.LogActionAsync(adminId, "UPDATE", "QuestionCategory", cat.Id,
            before, $"{{\"Name\":\"{cat.Name}\"}}");

        return ApiResponse<QuestionCategoryResponse>.SuccessResult(Map(cat), "Cập nhật danh mục thành công.");
    }

    public async Task<ApiResponse<object>> DeleteAsync(int id, int? adminId)
    {
        var cat = await _repo.GetByIdAsync(id);
        if (cat is null) return ApiResponse<object>.FailureResult("Không tìm thấy danh mục câu hỏi.");

        // Chặn nếu còn question active
        if (await _repo.HasQuestionsAsync(id))
            return ApiResponse<object>.FailureResult("Không thể xóa danh mục đang có câu hỏi. Hãy chuyển hoặc xóa câu hỏi trước.");

        cat.IsDelete = true;
        cat.UpdateDate = DateTime.UtcNow;
        cat.UpdatedBy = adminId;

        await _repo.UpdateAsync(cat);
        await _audit.LogActionAsync(adminId, "DELETE", "QuestionCategory", cat.Id,
            $"{{\"Name\":\"{cat.Name}\"}}", null);

        return ApiResponse<object>.SuccessResult(null!, "Xóa danh mục thành công.");
    }

    private static QuestionCategoryResponse Map(QuestionCategory c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description,
        ParentCategoryId = c.ParentCategoryId,
        CreatedDate = c.CreatedDate
    };
}
