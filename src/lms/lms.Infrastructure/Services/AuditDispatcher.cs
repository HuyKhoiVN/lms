using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using lms.Application.Common.Audit;
using lms.Application.Interfaces.Services;

namespace lms.Infrastructure.Services;

/// <summary>
/// Triển khai <see cref="IAuditDispatcher"/>.
/// Quy ước theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 15 (Audit Logging):
///   - Append-only, không update/delete.
///   - Không log password / token plaintext (mask qua <see cref="SensitiveKeys"/>).
///   - Audit fail KHÔNG được làm fail business transaction.
/// </summary>
public sealed class AuditDispatcher : IAuditDispatcher
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

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = false,
        PropertyNamingPolicy = null
    };

    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<AuditDispatcher> _logger;

    public AuditDispatcher(IAuditLogService auditLogService, ILogger<AuditDispatcher> logger)
    {
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task DispatchAsync(
        int? userId,
        string action,
        string entityName,
        int? entityId,
        object? before,
        object? after,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var beforeJson = Serialize(before);
            var afterJson = Serialize(after);

            await _auditLogService.LogActionAsync(userId, action, entityName, entityId, beforeJson, afterJson);
        }
        catch (Exception ex)
        {
            // Audit failure không bao giờ làm fail business transaction.
            _logger.LogError(
                ex,
                "Audit dispatch failed. Action={Action} Entity={EntityName} EntityId={EntityId} UserId={UserId}",
                action,
                entityName,
                entityId,
                userId);
        }
    }

    private static string? Serialize(object? value)
    {
        if (value is null)
        {
            return null;
        }

        if (value is string s)
        {
            return s;
        }

        var masked = MaskSensitive(value);
        return JsonSerializer.Serialize(masked, JsonOptions);
    }

    /// <summary>
    /// Convert object về <see cref="Dictionary{TKey, TValue}"/> với các key nhạy cảm
    /// được thay bằng "***". Hỗ trợ object thường, dictionary, JsonElement.
    /// </summary>
    private static object? MaskSensitive(object? value)
    {
        if (value is null)
        {
            return null;
        }

        // Nếu là dictionary có sẵn
        if (value is IDictionary<string, object?> dictTyped)
        {
            return dictTyped.ToDictionary(
                kv => kv.Key,
                kv => SensitiveKeys.Contains(kv.Key) ? "***" : MaskSensitive(kv.Value));
        }

        var type = value.GetType();

        // Primitive / string / Guid / DateTime -> giữ nguyên
        if (type.IsPrimitive
            || value is string
            || value is decimal
            || value is DateTime
            || value is DateTimeOffset
            || value is Guid)
        {
            return value;
        }

        // Anonymous / POCO -> phản chiếu property công khai
        var result = new Dictionary<string, object?>();
        foreach (var prop in type.GetProperties(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance))
        {
            if (!prop.CanRead)
            {
                continue;
            }

            object? propValue;
            try
            {
                propValue = prop.GetValue(value);
            }
            catch
            {
                continue;
            }

            result[prop.Name] = SensitiveKeys.Contains(prop.Name) ? "***" : MaskSensitive(propValue);
        }
        return result;
    }
}
