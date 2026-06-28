using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.LearningProgress;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

/// <summary>
/// Business rules theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 6:
/// - ProgressPercent 0–100.
/// - IsCompleted = true khi percent >= 100.
/// - Student chỉ update progress của chính mình.
/// - Không update progress nếu material không thuộc course.
/// - Upsert: nếu record chưa có thì tạo, nếu đã có thì update.
/// </summary>
public sealed class LearningProgressService : ILearningProgressService
{
    private const decimal CompletionThreshold = 100m;

    private readonly ILearningProgressRepository _progressRepo;
    private readonly ILearningMaterialRepository _materialRepo;
    private readonly ICourseRepository _courseRepo;
    private readonly ICourseAccessService _courseAccess;
    private readonly IAuditLogService _auditLog;

    public LearningProgressService(
        ILearningProgressRepository progressRepo,
        ILearningMaterialRepository materialRepo,
        ICourseRepository courseRepo,
        ICourseAccessService courseAccess,
        IAuditLogService auditLog)
    {
        _progressRepo = progressRepo;
        _materialRepo = materialRepo;
        _courseRepo = courseRepo;
        _courseAccess = courseAccess;
        _auditLog = auditLog;
    }

    public async Task<ApiResponse<LearningProgressResponse>> UpdateProgressAsync(
        int userId, UpdateLearningProgressRequest request)
    {
        // Validate percent
        if (request.ProgressPercent < 0 || request.ProgressPercent > 100)
        {
            return ApiResponse<LearningProgressResponse>.FailureResult(
                "ProgressPercent phải trong khoảng 0–100.");
        }

        // Validate student có quyền truy cập course
        if (!await _courseAccess.HasAccessAsync(userId, request.CourseId))
        {
            return ApiResponse<LearningProgressResponse>.FailureResult(
                "Bạn không có quyền truy cập khóa học này.");
        }

        // Validate material thuộc course
        var material = await _materialRepo.GetByIdAsync(request.LearningMaterialId);
        if (material is null || material.CourseId != request.CourseId)
        {
            return ApiResponse<LearningProgressResponse>.FailureResult(
                "Học liệu không thuộc khóa học này.");
        }

        // Upsert
        var existing = await _progressRepo.GetByUserAndMaterialAsync(userId, request.LearningMaterialId);

        bool isNewCompletion = false;

        if (existing is null)
        {
            var percent = Math.Clamp(request.ProgressPercent, 0, 100);
            var completed = percent >= CompletionThreshold;

            existing = new LearningProgress
            {
                UserId = userId,
                CourseId = request.CourseId,
                LearningMaterialId = request.LearningMaterialId,
                ProgressPercent = percent,
                IsCompleted = completed,
                CompletedDate = completed ? DateTime.UtcNow : null,
                IsDelete = false,
                CreatedDate = DateTime.UtcNow
            };
            await _progressRepo.AddAsync(existing);
            isNewCompletion = completed;
        }
        else
        {
            var percent = Math.Clamp(request.ProgressPercent, 0, 100);
            var wasCompleted = existing.IsCompleted;
            var completed = percent >= CompletionThreshold;

            existing.ProgressPercent = percent;
            existing.IsCompleted = completed;
            if (completed && !wasCompleted)
            {
                existing.CompletedDate = DateTime.UtcNow;
                isNewCompletion = true;
            }
            existing.UpdateDate = DateTime.UtcNow;
            existing.UpdatedBy = userId;

            await _progressRepo.UpdateAsync(existing);
        }

        // Audit chỉ khi mới hoàn thành
        if (isNewCompletion)
        {
            await _auditLog.LogActionAsync(
                userId, "MATERIAL_COMPLETED", "LearningProgress", existing.Id,
                null, $"{{\"MaterialId\":{request.LearningMaterialId},\"CourseId\":{request.CourseId}}}");
        }

        return ApiResponse<LearningProgressResponse>.SuccessResult(MapToResponse(existing), "Cập nhật tiến độ thành công.");
    }

    public async Task<ApiResponse<PagedResult<LearningProgressResponse>>> GetMyProgressAsync(
        int userId, LearningProgressFilterRequest filter)
    {
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize is < 1 or > 100 ? 20 : filter.PageSize;

        var items = await _progressRepo.GetByUserAsync(userId, filter.CourseId, page, pageSize);
        var total = await _progressRepo.GetCountByUserAsync(userId, filter.CourseId);

        return ApiResponse<PagedResult<LearningProgressResponse>>.SuccessResult(
            new PagedResult<LearningProgressResponse>(
                items.Select(MapToResponse).ToList(), total, page, pageSize));
    }

    public async Task<ApiResponse<CourseProgressSummaryResponse>> GetCourseProgressSummaryAsync(
        int courseId, int? requestingUserId, bool isAdmin)
    {
        // Validate course tồn tại
        var course = await _courseRepo.GetByIdAsync(courseId);
        if (course is null)
            return ApiResponse<CourseProgressSummaryResponse>.FailureResult("Không tìm thấy khóa học.");

        // Student access check
        if (!isAdmin)
        {
            if (!requestingUserId.HasValue ||
                !await _courseAccess.HasAccessAsync(requestingUserId.Value, courseId))
            {
                return ApiResponse<CourseProgressSummaryResponse>.FailureResult(
                    "Bạn không có quyền truy cập khóa học này.");
            }
        }

        // Total materials in course
        var allMaterials = await _materialRepo.GetByCourseIdAsync(courseId);
        var totalMaterials = allMaterials.Count;

        // Progress records
        var progressList = requestingUserId.HasValue && !isAdmin
            ? await _progressRepo.GetByUserAsync(requestingUserId.Value, courseId, 1, 1000)
            : await _progressRepo.GetByCourseAsync(courseId);

        var completed = progressList.Count(x => x.IsCompleted);
        var overall = totalMaterials > 0
            ? Math.Round((decimal)completed / totalMaterials * 100, 2)
            : 0m;

        var summary = new CourseProgressSummaryResponse
        {
            CourseId = courseId,
            TotalMaterials = totalMaterials,
            CompletedMaterials = completed,
            OverallPercent = overall,
            Details = progressList.Select(MapToResponse).ToList()
        };

        return ApiResponse<CourseProgressSummaryResponse>.SuccessResult(summary);
    }

    private static LearningProgressResponse MapToResponse(LearningProgress p) => new()
    {
        Id = p.Id,
        UserId = p.UserId,
        CourseId = p.CourseId,
        LearningMaterialId = p.LearningMaterialId,
        ProgressPercent = p.ProgressPercent,
        IsCompleted = p.IsCompleted,
        CompletedDate = p.CompletedDate,
        LastAccessedDate = p.UpdateDate ?? p.CreatedDate
    };
}
