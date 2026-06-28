using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.AuditLogs;
using lms.Application.DTOs.Common;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

/// <summary>
/// Truy vấn audit log — Admin only.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 15 Audit Logging.
/// AuditLogs là append-only; controller chỉ cung cấp các endpoint đọc.
/// </summary>
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/audit-logs")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditQueryService _queryService;

    public AuditLogsController(IAuditQueryService queryService)
    {
        _queryService = queryService;
    }

    /// <summary>
    /// Lấy danh sách audit log có phân trang và filter.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AuditLogListItemResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPaged([FromQuery] AuditLogFilterRequest filter)
    {
        var result = await _queryService.GetPagedAsync(filter);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết 1 bản ghi audit log (bao gồm BeforeData/AfterData đã mask).
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<AuditLogDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _queryService.GetByIdAsync(id);
        if (!result.Success)
        {
            return NotFound(result);
        }
        return Ok(result);
    }
}
