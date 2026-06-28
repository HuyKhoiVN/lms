using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Application.DTOs.AuditLogs;
using lms.Application.DTOs.Common;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;

namespace lms.Application.Services;

/// <summary>
/// Đọc audit log dành cho Admin.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 15:
///   - AuditLogs append-only: KHÔNG update/delete.
///   - BeforeData/AfterData phải được mask trước khi expose (đã thực hiện bởi AuditDispatcher khi ghi).
///   - Query phải có pagination.
/// </summary>
public sealed class AuditQueryService : IAuditQueryService
{
    private readonly IAuditLogRepository _repo;
    private readonly IUserRepository _userRepo;

    public AuditQueryService(IAuditLogRepository repo, IUserRepository userRepo)
    {
        _repo = repo;
        _userRepo = userRepo;
    }

    public async Task<ApiResponse<PagedResult<AuditLogListItemResponse>>> GetPagedAsync(AuditLogFilterRequest filter)
    {
        // Clamp pagination
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize is < 1 or > 200 ? 20 : filter.PageSize;

        var logs = await _repo.GetPagedAsync(
            filter.UserId,
            filter.Action,
            filter.EntityName,
            filter.FromDate,
            filter.ToDate,
            page,
            pageSize);

        var total = await _repo.GetCountAsync(
            filter.UserId,
            filter.Action,
            filter.EntityName,
            filter.FromDate,
            filter.ToDate);

        var items = new List<AuditLogListItemResponse>(logs.Count);
        foreach (var log in logs)
        {
            items.Add(new AuditLogListItemResponse
            {
                Id = log.Id,
                UserId = log.UserId == 0 ? null : log.UserId,
                Action = log.Action ?? string.Empty,
                EntityName = log.EntityName ?? string.Empty,
                EntityId = log.EntityId,
                CreatedDate = log.CreatedDate
            });
        }

        return ApiResponse<PagedResult<AuditLogListItemResponse>>.SuccessResult(
            new PagedResult<AuditLogListItemResponse>(items, total, page, pageSize));
    }

    public async Task<ApiResponse<AuditLogDetailResponse>> GetByIdAsync(int id)
    {
        var log = await _repo.GetByIdAsync(id);
        if (log is null)
        {
            return ApiResponse<AuditLogDetailResponse>.FailureResult("Không tìm thấy bản ghi audit.");
        }

        string? userName = null;
        if (log.UserId > 0)
        {
            var user = await _userRepo.GetByIdAsync((int)log.UserId);
            userName = user?.UserName;
        }

        var response = new AuditLogDetailResponse
        {
            Id = log.Id,
            UserId = log.UserId == 0 ? null : log.UserId,
            UserName = userName,
            Action = log.Action ?? string.Empty,
            EntityName = log.EntityName ?? string.Empty,
            EntityId = log.EntityId,
            // BeforeData/AfterData đã được mask bởi AuditDispatcher khi ghi.
            BeforeData = log.BeforeData,
            AfterData = log.AfterData,
            CreatedDate = log.CreatedDate
        };

        return ApiResponse<AuditLogDetailResponse>.SuccessResult(response);
    }
}
