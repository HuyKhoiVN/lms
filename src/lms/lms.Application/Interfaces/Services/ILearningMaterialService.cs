using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.LearningMaterials;

namespace lms.Application.Interfaces.Services;

/// <summary>
/// CRUD hoc lieu, theo doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md mục 5.
/// </summary>
public interface ILearningMaterialService
{
    Task<ApiResponse<LearningMaterialDetailResponse>> GetByIdAsync(int id);
    Task<ApiResponse<PagedResult<LearningMaterialListItemResponse>>> GetPagedAsync(LearningMaterialFilterRequest filter, int? studentUserId);
    Task<ApiResponse<LearningMaterialDetailResponse>> CreateAsync(CreateLearningMaterialRequest request, int? adminId);
    Task<ApiResponse<LearningMaterialDetailResponse>> UpdateAsync(int id, UpdateLearningMaterialRequest request, int? adminId);
    Task<ApiResponse<object>> DeleteAsync(int id, int? adminId);
}
