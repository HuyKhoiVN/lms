using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using lms.Application.Common.Exceptions;
using lms.Application.DTOs.Common;

namespace lms.Api.Middlewares;

/// <summary>
/// Bắt mọi exception bubble từ controller/service và map sang HTTP status + envelope ApiResponse.
/// Theo doc/17_BACKEND_MODULE_DESIGN/README.md "REST response standard" và "Common HTTP status codes".
/// </summary>
public sealed class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleAsync(context, ex);
        }
    }

    private async Task HandleAsync(HttpContext context, Exception exception)
    {
        if (context.Response.HasStarted)
        {
            _logger.LogWarning(exception, "Response already started; cannot rewrite to ApiResponse envelope.");
            throw exception;
        }

        var (status, response) = Map(exception);

        if (status >= 500)
        {
            _logger.LogError(exception, "Unhandled exception on {Path}", context.Request.Path);
        }
        else
        {
            _logger.LogWarning(
                "Domain exception on {Path}. Status={Status} Message={Message}",
                context.Request.Path,
                status,
                response.Message);
        }

        context.Response.Clear();
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json; charset=utf-8";

        var json = JsonSerializer.Serialize(response, JsonOptions);
        await context.Response.WriteAsync(json);
    }

    private (int Status, ApiResponse<object> Body) Map(Exception ex)
    {
        return ex switch
        {
            ValidationException v => (
                StatusCodes.Status400BadRequest,
                ApiResponse<object>.FailureResult(v.Message, new System.Collections.Generic.List<string>(v.Errors))),

            UnauthorizedException u => (
                StatusCodes.Status401Unauthorized,
                ApiResponse<object>.FailureResult(u.Message)),

            ForbiddenException f => (
                StatusCodes.Status403Forbidden,
                ApiResponse<object>.FailureResult(f.Message)),

            NotFoundException n => (
                StatusCodes.Status404NotFound,
                ApiResponse<object>.FailureResult(n.Message)),

            ConflictException c => (
                StatusCodes.Status409Conflict,
                ApiResponse<object>.FailureResult(c.Message)),

            BusinessRuleException b => (
                StatusCodes.Status422UnprocessableEntity,
                ApiResponse<object>.FailureResult(b.Message)),

            OperationCanceledException => (
                499, // client closed request
                ApiResponse<object>.FailureResult("Yêu cầu đã bị hủy.")),

            _ => (
                StatusCodes.Status500InternalServerError,
                ApiResponse<object>.FailureResult(
                    _env.IsDevelopment() ? $"Lỗi máy chủ: {ex.Message}" : "Đã có lỗi xảy ra. Vui lòng thử lại sau."))
        };
    }
}
