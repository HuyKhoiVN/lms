using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Users;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/groups")]
public class GroupsController : ControllerBase
{
    private readonly IGroupService _groupService;
    private readonly IGroupMemberService _groupMemberService;

    public GroupsController(IGroupService groupService, IGroupMemberService groupMemberService)
    {
        _groupService = groupService;
        _groupMemberService = groupMemberService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<GroupListItemResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged([FromQuery] GroupFilterRequest filter)
    {
        var result = await _groupService.GetPagedAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<GroupDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _groupService.GetByIdAsync(id);
        if (!result.Success)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<GroupDetailResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateGroupRequest request)
    {
        var result = await _groupService.CreateGroupAsync(request);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<GroupDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateGroupRequest request)
    {
        var result = await _groupService.UpdateGroupAsync(id, request);
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("Không tìm thấy"))
            {
                return NotFound(result);
            }
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _groupService.DeleteGroupAsync(id);
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("Không tìm thấy"))
            {
                return NotFound(result);
            }
            return BadRequest(result);
        }
        return NoContent();
    }

    [HttpGet("{groupId}/users")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<GroupMemberResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMembers(int groupId, [FromQuery] GroupMemberFilterRequest filter)
    {
        var result = await _groupMemberService.GetMembersAsync(groupId, filter.Page, filter.PageSize, filter.Keyword);
        if (!result.Success)
        {
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpPost("{groupId}/users")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddMember(int groupId, [FromBody] AddGroupUserRequest request)
    {
        var result = await _groupMemberService.AddMemberAsync(groupId, request);
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("Không tìm thấy"))
            {
                return NotFound(result);
            }
            return BadRequest(result);
        }
        return Ok(result);
    }

    [HttpDelete("{groupId}/users/{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveMember(int groupId, int userId)
    {
        var result = await _groupMemberService.RemoveMemberAsync(groupId, userId);
        if (!result.Success)
        {
            if (result.Message != null && result.Message.Contains("không thuộc nhóm"))
            {
                return NotFound(result);
            }
            return BadRequest(result);
        }
        return NoContent();
    }
}
