using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

public class AuditLogService : IAuditLogService
{
    private static readonly HashSet<string> SensitiveKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "Password",
        "PasswordHash",
        "OldPassword",
        "NewPassword",
        "Token",
        "AccessToken",
        "RefreshToken",
        "Secret",
        "ApiKey"
    };

    private readonly IAuditLogRepository _auditLogRepository;

    public AuditLogService(IAuditLogRepository auditLogRepository)
    {
        _auditLogRepository = auditLogRepository;
    }

    public async Task LogActionAsync(int? userId, string action, string entityName, int? entityId, string? beforeData, string? afterData)
    {
        var log = new AuditLog
        {
            UserId = userId ?? 0, // 0 can represent System
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            BeforeData = SanitizeJson(beforeData),
            AfterData = SanitizeJson(afterData),
            CreatedDate = DateTime.UtcNow,
            IsDelete = false
        };

        await _auditLogRepository.AddAsync(log);
    }

    private static string? SanitizeJson(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        try
        {
            using var doc = JsonDocument.Parse(value);
            var masked = MaskElement(doc.RootElement);
            return JsonSerializer.Serialize(masked);
        }
        catch (JsonException)
        {
            return value;
        }
    }

    private static object? MaskElement(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.Object => element.EnumerateObject().ToDictionary(
                p => p.Name,
                p => SensitiveKeys.Contains(p.Name) ? "***" : MaskElement(p.Value)),
            JsonValueKind.Array => element.EnumerateArray().Select(MaskElement).ToList(),
            JsonValueKind.String => element.GetString(),
            JsonValueKind.Number => element.TryGetInt64(out var l) ? l : element.GetDecimal(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            _ => null
        };
    }
}
