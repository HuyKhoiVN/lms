using System.Threading.Tasks;

namespace lms.Application.Interfaces.Services;

/// <summary>
/// Kiểm tra học viên có quyền thi exam không.
/// Access hợp lệ khi: direct assignment, group assignment, hoặc course exam thuộc course được assign.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 9.
/// </summary>
public interface IExamAccessService
{
    Task<bool> HasAccessAsync(int userId, int examId);
}
