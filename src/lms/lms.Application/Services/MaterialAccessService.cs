using System.Linq;
using System.Threading.Tasks;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;

namespace lms.Application.Services;

/// <summary>
/// Học viên có quyền xem material khi được assign course chứa material đó,
/// hoặc course assign qua group mà học viên là thành viên.
/// Theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 5 Security.
/// </summary>
public sealed class MaterialAccessService : IMaterialAccessService
{
    private readonly ILearningMaterialRepository _materialRepo;
    private readonly ICourseAccessService _courseAccessService;

    public MaterialAccessService(
        ILearningMaterialRepository materialRepo,
        ICourseAccessService courseAccessService)
    {
        _materialRepo = materialRepo;
        _courseAccessService = courseAccessService;
    }

    public async Task<bool> HasAccessAsync(int studentId, int materialId)
    {
        var material = await _materialRepo.GetByIdAsync(materialId);
        if (material is null)
        {
            return false;
        }

        // Delegate tới CourseAccessService đã có từ Phase 2
        return await _courseAccessService.HasAccessAsync(studentId, material.CourseId);
    }
}
