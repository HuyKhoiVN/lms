using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Users;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

public class GroupService : IGroupService
{
    private readonly IGroupRepository _groupRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;

    public GroupService(
        IGroupRepository groupRepository,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService)
    {
        _groupRepository = groupRepository;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
    }

    public async Task<ApiResponse<GroupDetailResponse>> CreateGroupAsync(CreateGroupRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return ApiResponse<GroupDetailResponse>.FailureResult("Tên nhóm không được để trống.");
        }

        var existingGroup = await _groupRepository.GetByNameAsync(request.Name);
        if (existingGroup != null)
        {
            return ApiResponse<GroupDetailResponse>.FailureResult($"Tên nhóm '{request.Name}' đã tồn tại.");
        }

        var currentUserId = _currentUserService.UserId;
        var group = new Group
        {
            Name = request.Name,
            Description = request.Description,
            IsDelete = false,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = currentUserId
        };

        await _groupRepository.AddAsync(group);

        await _auditLogService.LogActionAsync(
            currentUserId,
            "CREATE",
            "Group",
            group.Id,
            null,
            $"{{\"Name\":\"{group.Name}\",\"Description\":\"{group.Description}\"}}"
        );

        var response = new GroupDetailResponse
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description,
            CreatedDate = group.CreatedDate
        };

        return ApiResponse<GroupDetailResponse>.SuccessResult(response, "Tạo nhóm thành công.");
    }

    public async Task<ApiResponse<GroupDetailResponse>> UpdateGroupAsync(int id, UpdateGroupRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return ApiResponse<GroupDetailResponse>.FailureResult("Tên nhóm không được để trống.");
        }

        var group = await _groupRepository.GetByIdAsync(id);
        if (group == null)
        {
            return ApiResponse<GroupDetailResponse>.FailureResult("Không tìm thấy nhóm học viên.");
        }

        if (!string.Equals(group.Name, request.Name, StringComparison.OrdinalIgnoreCase))
        {
            var existingGroup = await _groupRepository.GetByNameAsync(request.Name);
            if (existingGroup != null)
            {
                return ApiResponse<GroupDetailResponse>.FailureResult($"Tên nhóm '{request.Name}' đã tồn tại.");
            }
        }

        var currentUserId = _currentUserService.UserId;
        var beforeData = $"{{\"Name\":\"{group.Name}\",\"Description\":\"{group.Description}\"}}";

        group.Name = request.Name;
        group.Description = request.Description;
        group.UpdateDate = DateTime.UtcNow;
        group.UpdatedBy = currentUserId;

        await _groupRepository.UpdateAsync(group);

        await _auditLogService.LogActionAsync(
            currentUserId,
            "UPDATE",
            "Group",
            group.Id,
            beforeData,
            $"{{\"Name\":\"{group.Name}\",\"Description\":\"{group.Description}\"}}"
        );

        var response = new GroupDetailResponse
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description,
            CreatedDate = group.CreatedDate
        };

        return ApiResponse<GroupDetailResponse>.SuccessResult(response, "Cập nhật nhóm thành công.");
    }

    public async Task<ApiResponse<object>> DeleteGroupAsync(int id)
    {
        var group = await _groupRepository.GetByIdAsync(id);
        if (group == null)
        {
            return ApiResponse<object>.FailureResult("Không tìm thấy nhóm học viên.");
        }

        var currentUserId = _currentUserService.UserId;
        group.IsDelete = true;
        group.UpdateDate = DateTime.UtcNow;
        group.UpdatedBy = currentUserId;

        await _groupRepository.UpdateAsync(group);

        await _auditLogService.LogActionAsync(
            currentUserId,
            "DELETE",
            "Group",
            group.Id,
            $"{{\"Name\":\"{group.Name}\"}}",
            null
        );

        return ApiResponse<object>.SuccessResult(null!, "Xóa nhóm thành công.");
    }

    public async Task<ApiResponse<GroupDetailResponse>> GetByIdAsync(int id)
    {
        var group = await _groupRepository.GetByIdAsync(id);
        if (group == null)
        {
            return ApiResponse<GroupDetailResponse>.FailureResult("Không tìm thấy nhóm học viên.");
        }

        var response = new GroupDetailResponse
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description,
            CreatedDate = group.CreatedDate
        };

        return ApiResponse<GroupDetailResponse>.SuccessResult(response);
    }

    public async Task<ApiResponse<PagedResult<GroupListItemResponse>>> GetPagedAsync(GroupFilterRequest filter)
    {
        var groups = await _groupRepository.GetPagedAsync(filter.Keyword, filter.Page, filter.PageSize);
        var total = await _groupRepository.GetCountAsync(filter.Keyword);

        var items = groups.Select(g => new GroupListItemResponse
        {
            Id = g.Id,
            Name = g.Name,
            Description = g.Description
        }).ToList();

        var pagedResult = new PagedResult<GroupListItemResponse>(items, total, filter.Page, filter.PageSize);
        return ApiResponse<PagedResult<GroupListItemResponse>>.SuccessResult(pagedResult);
    }
}
