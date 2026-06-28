using System;
using System.Collections.Generic;

namespace lms.Application.DTOs.AuditLogs;

/// <summary>
/// Filter request cho audit log admin query.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 15 Audit Logging.
/// </summary>
public sealed class AuditLogFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int? UserId { get; set; }
    public string? Action { get; set; }
    public string? EntityName { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

/// <summary>
/// Item trong danh sách audit log — không expose BeforeData/AfterData đầy đủ theo quy tắc bảo mật.
/// Admin cần detail thì dùng /api/v1/audit-logs/{id}.
/// </summary>
public sealed class AuditLogListItemResponse
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string? UserName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public DateTime? CreatedDate { get; set; }
}

/// <summary>
/// Chi tiết 1 audit log bao gồm BeforeData/AfterData (đã mask sensitive).
/// </summary>
public sealed class AuditLogDetailResponse
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string? UserName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string? BeforeData { get; set; }
    public string? AfterData { get; set; }
    public DateTime? CreatedDate { get; set; }
}
