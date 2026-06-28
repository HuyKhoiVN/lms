using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Users;

namespace lms.Application.Interfaces.Services;

public interface IGroupService
{
    Task<ApiResponse<GroupDetailResponse>> CreateGroupAsync(CreateGroupRequest request);
    Task<ApiResponse<GroupDetailResponse>> UpdateGroupAsync(int id, UpdateGroupRequest request);
    Task<ApiResponse<object>> DeleteGroupAsync(int id);
    Task<ApiResponse<GroupDetailResponse>> GetByIdAsync(int id);
    Task<ApiResponse<PagedResult<GroupListItemResponse>>> GetPagedAsync(GroupFilterRequest filter);
}
