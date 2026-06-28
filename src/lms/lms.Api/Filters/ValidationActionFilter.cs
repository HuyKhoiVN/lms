using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc.Filters;
using lms.Application.Common.Exceptions;

namespace lms.Api.Filters;

/// <summary>
/// Action filter chuyển ModelState lỗi (sau khi FluentValidation gắn vào model state)
/// thành <see cref="ValidationException"/> để ExceptionHandlingMiddleware xử lý.
/// </summary>
public sealed class ValidationActionFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (context.ModelState.IsValid)
        {
            return;
        }

        var errors = context.ModelState
            .Where(x => x.Value is not null && x.Value!.Errors.Count > 0)
            .SelectMany(x => x.Value!.Errors.Select(e => string.IsNullOrEmpty(e.ErrorMessage)
                ? e.Exception?.Message ?? "Invalid"
                : e.ErrorMessage))
            .ToList();

        throw new ValidationException("Dữ liệu yêu cầu không hợp lệ.", errors);
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
    }
}
