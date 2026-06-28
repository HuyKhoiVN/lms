using System.Threading;
using System.Threading.Tasks;

namespace lms.Application.Common.Audit;

/// <summary>
/// Facade dùng cho mọi service nghiệp vụ để ghi audit.
/// Implementation phải đảm bảo: append-only, KHÔNG throw exception ra ngoài
/// (audit fail không được làm fail business transaction), tự serialize before/after
/// và mask trường nhạy cảm (PasswordHash, Token, ...).
/// </summary>
public interface IAuditDispatcher
{
    /// <summary>
    /// Ghi 1 bản ghi audit log.
    /// </summary>
    /// <param name="userId">Id user thực hiện action; null nếu là anonymous/system.</param>
    /// <param name="action">Một trong các hằng số của <see cref="AuditAction"/>.</param>
    /// <param name="entityName">Tên entity (PascalCase, ví dụ "User", "Course").</param>
    /// <param name="entityId">Id logic của entity tác động.</param>
    /// <param name="before">Trạng thái trước thay đổi (sẽ serialize ra JSON, có mask).</param>
    /// <param name="after">Trạng thái sau thay đổi (sẽ serialize ra JSON, có mask).</param>
    /// <param name="cancellationToken">Cancellation token (không bắt buộc).</param>
    Task DispatchAsync(
        int? userId,
        string action,
        string entityName,
        int? entityId,
        object? before,
        object? after,
        CancellationToken cancellationToken = default);
}
