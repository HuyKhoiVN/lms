using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Users;

namespace lms.Application.Interfaces.Services;

public interface IGroupMemberService
{
    Task<ApiResponse<PagedResult<GroupMemberResponse>>> GetMembersAsync(int groupId, int page, int pageSize, string? keyword);
    Task<ApiResponse<object>> AddMemberAsync(int groupId, AddGroupUserRequest request);
    Task<ApiResponse<object>> RemoveMemberAsync(int groupId, int userId);
}
