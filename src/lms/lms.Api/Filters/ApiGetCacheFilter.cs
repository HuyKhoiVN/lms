using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using lms.Api.Configuration;

namespace lms.Api.Filters;

public sealed class ApiGetCacheFilter : IAsyncActionFilter
{
    private static readonly HashSet<string> NeverCacheSegments = new(StringComparer.OrdinalIgnoreCase)
    {
        "auth",
        "files",
        "exam-attempts"
    };

    private static readonly Dictionary<string, string[]> InvalidationTagsBySegment = new(StringComparer.OrdinalIgnoreCase)
    {
        ["courses"] = new[] { "courses", "learning-materials", "reports", "dashboard", "progress", "exams" },
        ["learning-materials"] = new[] { "learning-materials", "courses", "progress", "dashboard" },
        ["learning-progress"] = new[] { "progress", "courses", "dashboard", "learning-materials" },
        ["question-categories"] = new[] { "questions", "question-categories", "exams", "reports" },
        ["questions"] = new[] { "questions", "question-categories", "exams", "reports" },
        ["exams"] = new[] { "exams", "assignments", "results", "reports", "dashboard", "courses" },
        ["exam-assignments"] = new[] { "exams", "assignments", "results", "reports", "dashboard" },
        ["group-exam-assignments"] = new[] { "exams", "assignments", "results", "reports", "dashboard" },
        ["results"] = new[] { "results", "certificates", "reports", "dashboard", "exams" },
        ["certificates"] = new[] { "results", "certificates", "reports", "dashboard" },
        ["users"] = new[] { "users", "groups", "courses", "exams", "reports", "dashboard" },
        ["groups"] = new[] { "users", "groups", "courses", "exams", "reports", "dashboard" },
        ["reports"] = new[] { "reports", "dashboard" },
        ["audit-logs"] = new[] { "audit-logs" }
    };

    private readonly IApiCacheInvalidator _cache;
    private readonly ApiCacheOptions _options;

    public ApiGetCacheFilter(IApiCacheInvalidator cache, IOptions<ApiCacheOptions> options)
    {
        _cache = cache;
        _options = options.Value;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!_options.Enabled)
        {
            await next();
            return;
        }

        if (IsNoCacheEndpoint(context) || !IsAuthenticated(context.HttpContext))
        {
            await next();
            return;
        }

        var request = context.HttpContext.Request;
        if (HttpMethods.IsGet(request.Method))
        {
            await HandleGetAsync(context, next);
            return;
        }

        var executedContext = await next();
        if (IsSuccessfulMutation(request.Method, executedContext))
        {
            InvalidateForRequest(request);
        }
    }

    private async Task HandleGetAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var request = context.HttpContext.Request;
        if (!IsCacheableGet(request))
        {
            await next();
            return;
        }

        var key = BuildCacheKey(context.HttpContext);
        if (_cache.TryGet(key, out var cachedResponse) && cachedResponse != null)
        {
            context.Result = new ObjectResult(cachedResponse.Value)
            {
                StatusCode = cachedResponse.StatusCode ?? StatusCodes.Status200OK
            };
            context.HttpContext.Response.Headers["X-LMS-Cache"] = "HIT";
            return;
        }

        var executedContext = await next();
        context.HttpContext.Response.Headers["X-LMS-Cache"] = "MISS";

        if (executedContext.Result is not ObjectResult objectResult || !IsSuccessfulObjectResult(objectResult))
        {
            return;
        }

        var ttlSeconds = ResolveTtlSeconds(context);
        if (ttlSeconds <= 0)
        {
            return;
        }

        var tags = ResolveCacheTags(context, request);
        _cache.Set(
            key,
            new CachedApiResponse
            {
                StatusCode = objectResult.StatusCode ?? StatusCodes.Status200OK,
                Value = objectResult.Value
            },
            ttlSeconds,
            tags);
    }

    private bool IsCacheableGet(HttpRequest request)
    {
        var segments = GetPathSegments(request);
        if (segments.Length == 0)
        {
            return false;
        }

        if (NeverCacheSegments.Contains(segments[0]))
        {
            return false;
        }

        var path = request.Path.Value ?? string.Empty;
        return !path.Contains("/download", StringComparison.OrdinalIgnoreCase)
            && !path.Contains("/stream", StringComparison.OrdinalIgnoreCase)
            && !path.Contains("/export/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAuthenticated(HttpContext httpContext)
    {
        return httpContext.User.Identity?.IsAuthenticated == true;
    }

    private static bool IsNoCacheEndpoint(ActionExecutingContext context)
    {
        if (context.ActionDescriptor is not ControllerActionDescriptor descriptor)
        {
            return false;
        }

        return descriptor.MethodInfo.GetCustomAttribute<NoApiCacheAttribute>(inherit: true) != null
            || descriptor.ControllerTypeInfo.GetCustomAttribute<NoApiCacheAttribute>(inherit: true) != null;
    }

    private static bool IsSuccessfulObjectResult(ObjectResult result)
    {
        var statusCode = result.StatusCode ?? StatusCodes.Status200OK;
        if (statusCode < StatusCodes.Status200OK || statusCode >= StatusCodes.Status300MultipleChoices)
        {
            return false;
        }

        var successProperty = result.Value?.GetType().GetProperty("Success");
        if (successProperty != null && successProperty.PropertyType == typeof(bool))
        {
            return successProperty.GetValue(result.Value) is true;
        }

        return true;
    }

    private static bool IsSuccessfulMutation(string method, ActionExecutedContext context)
    {
        if (HttpMethods.IsGet(method) || context.Exception != null)
        {
            return false;
        }

        return context.Result switch
        {
            ObjectResult objectResult => IsSuccessfulObjectResult(objectResult),
            StatusCodeResult statusCodeResult => statusCodeResult.StatusCode >= StatusCodes.Status200OK
                && statusCodeResult.StatusCode < StatusCodes.Status300MultipleChoices,
            EmptyResult => true,
            _ => false
        };
    }

    private int ResolveTtlSeconds(ActionExecutingContext context)
    {
        var attribute = GetCacheAttribute(context);
        if (attribute?.TtlSeconds > 0)
        {
            return attribute.TtlSeconds;
        }

        var primarySegment = GetPrimarySegment(context.HttpContext.Request);
        if (primarySegment != null
            && _options.RouteTtlSeconds.TryGetValue(primarySegment, out var routeTtl)
            && routeTtl > 0)
        {
            return routeTtl;
        }

        return _options.DefaultTtlSeconds;
    }

    private string[] ResolveCacheTags(ActionExecutingContext context, HttpRequest request)
    {
        var tags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var primarySegment = GetPrimarySegment(request);
        if (primarySegment != null)
        {
            tags.Add(primarySegment);
        }

        if (primarySegment != null && InvalidationTagsBySegment.TryGetValue(primarySegment, out var relatedTags))
        {
            foreach (var tag in relatedTags)
            {
                tags.Add(tag);
            }
        }

        var attribute = GetCacheAttribute(context);
        if (attribute?.Tags != null)
        {
            foreach (var tag in attribute.Tags)
            {
                tags.Add(tag);
            }
        }

        return tags.ToArray();
    }

    private static ApiCacheAttribute? GetCacheAttribute(ActionExecutingContext context)
    {
        if (context.ActionDescriptor is not ControllerActionDescriptor descriptor)
        {
            return null;
        }

        return descriptor.MethodInfo.GetCustomAttribute<ApiCacheAttribute>(inherit: true)
            ?? descriptor.ControllerTypeInfo.GetCustomAttribute<ApiCacheAttribute>(inherit: true);
    }

    private void InvalidateForRequest(HttpRequest request)
    {
        var primarySegment = GetPrimarySegment(request);
        if (primarySegment == null)
        {
            _cache.ClearAll();
            return;
        }

        if (InvalidationTagsBySegment.TryGetValue(primarySegment, out var tags))
        {
            _cache.ClearByTags(tags);
            return;
        }

        _cache.ClearAll();
    }

    private static string BuildCacheKey(HttpContext httpContext)
    {
        var request = httpContext.Request;
        var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
        var role = httpContext.User.FindFirstValue(ClaimTypes.Role) ?? "none";
        var normalizedQuery = string.Join(
            "&",
            request.Query
                .OrderBy(pair => pair.Key, StringComparer.OrdinalIgnoreCase)
                .SelectMany(pair => pair.Value
                    .OrderBy(value => value, StringComparer.Ordinal)
                    .Select(value => $"{pair.Key}={value}")));

        return string.Join(
            "|",
            "api-get",
            request.Method.ToUpperInvariant(),
            request.Path.Value?.ToLowerInvariant() ?? string.Empty,
            normalizedQuery,
            $"user:{userId}",
            $"role:{role}");
    }

    private static string? GetPrimarySegment(HttpRequest request)
    {
        var segments = GetPathSegments(request);
        return segments.Length > 0 ? segments[0] : null;
    }

    private static string[] GetPathSegments(HttpRequest request)
    {
        var path = request.Path.Value ?? string.Empty;
        var segments = path
            .Split('/', StringSplitOptions.RemoveEmptyEntries)
            .Select(segment => segment.Trim().ToLowerInvariant())
            .ToArray();

        if (segments.Length >= 2 && segments[0] == "api" && segments[1].StartsWith("v", StringComparison.OrdinalIgnoreCase))
        {
            return segments.Skip(2).ToArray();
        }

        return segments;
    }
}
