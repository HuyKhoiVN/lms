using System.Threading.Tasks;

namespace lms.Application.Interfaces.Services;

public interface IAuditLogService
{
    Task LogActionAsync(int? userId, string action, string entityName, int? entityId, string? beforeData, string? afterData);
}
