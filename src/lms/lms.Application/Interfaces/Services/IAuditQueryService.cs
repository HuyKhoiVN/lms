using System.Threading.Tasks;
using lms.Application.DTOs.AuditLogs;
using lms.Application.DTOs.Common;

namespace lms.Application.Interfaces.Services;

/// <summary>
/// Service đọc audit log dành cho Admin.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 15 Audit Logging.
/// </summary>
public interface IAuditQueryService
{
    Task<ApiResponse<PagedResult<AuditLogListItemResponse>>> GetPagedAsync(AuditLogFilterRequest filter);
    Task<ApiResponse<AuditLogDetailResponse>> GetByIdAsync(int id);
}
