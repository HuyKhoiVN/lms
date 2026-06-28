using System.Threading.Tasks;

namespace lms.Application.Interfaces.Services;

/// <summary>
/// Kiểm tra quyền truy cập learning material theo doc/17 mục 5 Security:
/// Student chỉ xem material thuộc course đã được assign (direct hoặc qua group).
/// </summary>
public interface IMaterialAccessService
{
    Task<bool> HasAccessAsync(int studentId, int materialId);
}
