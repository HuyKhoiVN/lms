using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.Reports;
using lms.Application.Interfaces.Services;

namespace lms.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/v1/reports")]
public sealed class ReportsController : ControllerBase
{
    private readonly IReportService _reports;
    private readonly IReportExportService _exports;
    private readonly ICurrentUserService _currentUser;

    public ReportsController(IReportService reports, IReportExportService exports, ICurrentUserService currentUser)
    {
        _reports = reports;
        _exports = exports;
        _currentUser = currentUser;
    }

    [HttpGet("exam-summary")]
    [ProducesResponseType(typeof(ApiResponse<ExamSummaryReportResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExamSummary([FromQuery] ReportFilterRequest filter)
    {
        return Ok(await _reports.GetExamSummaryAsync(filter, _currentUser.UserId));
    }

    [HttpGet("pass-rate")]
    [ProducesResponseType(typeof(ApiResponse<PassRateReportResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PassRate([FromQuery] ReportFilterRequest filter)
    {
        return Ok(await _reports.GetPassRateAsync(filter, _currentUser.UserId));
    }

    [HttpGet("question-analysis")]
    [ProducesResponseType(typeof(ApiResponse<QuestionAnalysisReportResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> QuestionAnalysis([FromQuery] ReportFilterRequest filter)
    {
        return Ok(await _reports.GetQuestionAnalysisAsync(filter, _currentUser.UserId));
    }

    [HttpGet("learning-summary")]
    [ProducesResponseType(typeof(ApiResponse<LearningSummaryReportResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> LearningSummary([FromQuery] ReportFilterRequest filter)
    {
        return Ok(await _reports.GetLearningSummaryAsync(filter, _currentUser.UserId));
    }

    [HttpGet("export/excel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportExcel([FromQuery] ReportExportRequest request)
    {
        var result = await _exports.ExportCsvAsync(request, _currentUser.UserId);
        return File(result.Data!.Content, result.Data.ContentType, result.Data.FileName);
    }

    [HttpGet("export/pdf")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportPdf([FromQuery] ReportExportRequest request)
    {
        var result = await _exports.ExportPdfAsync(request, _currentUser.UserId);
        return File(result.Data!.Content, result.Data.ContentType, result.Data.FileName);
    }
}
