using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.LearningMaterials;

namespace lms.Application.Interfaces.Services;

public interface ILearningMaterialService
{
    Task<ApiResponse<LearningMaterialDetailResponse>> GetByIdAsync(int id);
    Task<ApiResponse<PagedResult<LearningMaterialListItemResponse>>> GetPagedAsync(LearningMaterialFilterRequest filter, int? studentUserId);
    Task<ApiResponse<LearningMaterialDetailResponse>> CreateAsync(CreateLearningMaterialRequest request, int? adminId);
    Task<ApiResponse<LearningMaterialDetailResponse>> UpdateAsync(int id, UpdateLearningMaterialRequest request, int? adminId);
    Task<ApiResponse<object>> DeleteAsync(int id, int? adminId);

    Task<ApiResponse<List<LearningMaterialBlockResponse>>> GetBlocksAsync(int materialId);
    Task<ApiResponse<LearningMaterialBlockResponse>> GetBlockAsync(int materialId, int blockId);
    Task<ApiResponse<LearningMaterialBlockResponse>> AddTextBlockAsync(int materialId, CreateTextMaterialBlockRequest request, int? adminId);
    Task<ApiResponse<LearningMaterialBlockResponse>> AddLinkBlockAsync(int materialId, CreateLinkMaterialBlockRequest request, int? adminId);
    Task<ApiResponse<LearningMaterialBlockResponse>> AddFileBlockAsync(int materialId, UploadMaterialBlockFileForm request, Stream fileStream, string fileName, string contentType, long fileSize, int? adminId);
    Task<ApiResponse<LearningMaterialBlockResponse>> UpdateBlockAsync(int materialId, int blockId, UpdateLearningMaterialBlockRequest request, int? adminId);
    Task<ApiResponse<List<LearningMaterialBlockResponse>>> ReorderBlocksAsync(int materialId, ReorderLearningMaterialBlocksRequest request, int? adminId);
    Task<ApiResponse<object>> DeleteBlockAsync(int materialId, int blockId, int? adminId);
}
