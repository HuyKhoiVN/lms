using System.Threading.Tasks;
using lms.Application.DTOs.Certificates;
using lms.Application.DTOs.Common;

namespace lms.Application.Interfaces.Services;

public interface ICertificateService
{
    Task<ApiResponse<PagedResult<CertificateListItemResponse>>> GetPagedAsync(
        CertificateFilterRequest filter, int? requestingUserId, bool isAdmin);
    Task<ApiResponse<CertificateDetailResponse>> GetByIdAsync(int id, int? requestingUserId, bool isAdmin);
    Task<ApiResponse<CertificateDetailResponse>> GenerateAsync(GenerateCertificateRequest request, int? adminId);
    Task<ApiResponse<CertificateFileResponse>> GetDownloadFileAsync(int id, int? requestingUserId, bool isAdmin);
}
