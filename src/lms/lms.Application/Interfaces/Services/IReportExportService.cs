using System.Threading.Tasks;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Reports;

namespace lms.Application.Interfaces.Services;

public interface IReportExportService
{
    Task<ApiResponse<ReportExportResponse>> ExportCsvAsync(ReportExportRequest request, int? adminId);
    Task<ApiResponse<ReportExportResponse>> ExportPdfAsync(ReportExportRequest request, int? adminId);
}
