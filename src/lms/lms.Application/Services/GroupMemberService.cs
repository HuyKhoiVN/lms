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

public class GroupMemberService : IGroupMemberService
{
    private readonly IGroupRepository _groupRepository;
    private readonly IUserRepository _userRepository;
    private readonly IGroupUserRepository _groupUserRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;

    public GroupMemberService(
        IGroupRepository groupRepository,
        IUserRepository userRepository,
        IGroupUserRepository groupUserRepository,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService)
    {
        _groupRepository = groupRepository;
        _userRepository = userRepository;
        _groupUserRepository = groupUserRepository;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
    }

    public async Task<ApiResponse<PagedResult<GroupMemberResponse>>> GetMembersAsync(int groupId, int page, int pageSize, string? keyword)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);
        if (group == null)
        {
            return ApiResponse<PagedResult<GroupMemberResponse>>.FailureResult("Không tìm thấy nhóm học viên.");
        }

        var members = await _groupUserRepository.GetMembersAsync(groupId, keyword, page, pageSize);
        var total = await _groupUserRepository.GetMembersCountAsync(groupId, keyword);

        var items = members.Select(u => new GroupMemberResponse
        {
            UserId = u.Id,
            UserName = u.UserName,
            FullName = u.FullName ?? string.Empty,
            Email = u.Email ?? string.Empty
        }).ToList();

        var pagedResult = new PagedResult<GroupMemberResponse>(items, total, page, pageSize);
        return ApiResponse<PagedResult<GroupMemberResponse>>.SuccessResult(pagedResult);
    }

    public async Task<ApiResponse<object>> AddMemberAsync(int groupId, AddGroupUserRequest request)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);
        if (group == null)
        {
            return ApiResponse<object>.FailureResult("Không tìm thấy nhóm học viên.");
        }

        var user = await _userRepository.GetByIdAsync(request.UserId);
        if (user == null)
        {
            return ApiResponse<object>.FailureResult("Không tìm thấy người dùng.");
        }

        if (user.IsLocked)
        {
            return ApiResponse<object>.FailureResult("Người dùng đang bị khóa, không thể thêm vào nhóm.");
        }

        var existingRelation = await _groupUserRepository.GetByGroupIdAndUserIdAsync(groupId, request.UserId);
        if (existingRelation != null)
        {
            return ApiResponse<object>.FailureResult("Người dùng đã tồn tại trong nhóm học viên này.");
        }

        var groupUser = new GroupUser
        {
            GroupId = groupId,
            UserId = request.UserId
        };

        await _groupUserRepository.AddAsync(groupUser);

        var currentUserId = _currentUserService.UserId;
        await _auditLogService.LogActionAsync(
            currentUserId,
            "ADD_GROUP_MEMBER",
            "Group",
            groupId,
            null,
            $"{{\"UserId\":{request.UserId},\"UserName\":\"{user.UserName}\"}}"
        );

        return ApiResponse<object>.SuccessResult(null!, "Thêm học viên vào nhóm thành công.");
    }

    public async Task<ApiResponse<object>> RemoveMemberAsync(int groupId, int userId)
    {
        var relation = await _groupUserRepository.GetByGroupIdAndUserIdAsync(groupId, userId);
        if (relation == null)
        {
            return ApiResponse<object>.FailureResult("Người dùng không thuộc nhóm học viên này.");
        }

        await _groupUserRepository.RemoveAsync(relation);

        var currentUserId = _currentUserService.UserId;
        await _auditLogService.LogActionAsync(
            currentUserId,
            "REMOVE_GROUP_MEMBER",
            "Group",
            groupId,
            $"{{\"UserId\":{userId}}}",
            null
        );

        return ApiResponse<object>.SuccessResult(null!, "Xóa học viên khỏi nhóm thành công.");
    }
}
