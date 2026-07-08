using System.Collections.Generic;
using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using lms.Api.Configuration;
using lms.Api.Filters;
using lms.Application.DTOs.Common;

namespace lms.UnitTests;

public class ApiGetCacheFilterTests
{
    [Fact]
    public async Task Get_ShouldCacheSuccessfulResponse_AndReturnHitWithoutCallingAction()
    {
        var filter = CreateFilter();

        var firstContext = CreateContext("GET", "/api/v1/courses", "?page=1", userId: "1");
        var firstCalled = false;
        await filter.OnActionExecutionAsync(firstContext, CreateDelegate(firstContext, () =>
        {
            firstCalled = true;
            return new OkObjectResult(ApiResponse<string>.SuccessResult("from-db"));
        }));

        var secondContext = CreateContext("GET", "/api/v1/courses", "?page=1", userId: "1");
        var secondCalled = false;
        await filter.OnActionExecutionAsync(secondContext, CreateDelegate(secondContext, () =>
        {
            secondCalled = true;
            return new OkObjectResult(ApiResponse<string>.SuccessResult("should-not-run"));
        }));

        Assert.True(firstCalled);
        Assert.False(secondCalled);

        var result = Assert.IsType<ObjectResult>(secondContext.Result);
        var response = Assert.IsType<ApiResponse<string>>(result.Value);
        Assert.True(response.Success);
        Assert.Equal("from-db", response.Data);
    }

    [Fact]
    public async Task Get_ShouldUseDifferentCacheEntries_ForDifferentQueryStrings()
    {
        var filter = CreateFilter();

        var pageOneContext = CreateContext("GET", "/api/v1/courses", "?page=1", userId: "1");
        await filter.OnActionExecutionAsync(pageOneContext, CreateDelegate(
            pageOneContext,
            () => new OkObjectResult(ApiResponse<string>.SuccessResult("page-1"))));

        var pageTwoContext = CreateContext("GET", "/api/v1/courses", "?page=2", userId: "1");
        var pageTwoCalled = false;
        await filter.OnActionExecutionAsync(pageTwoContext, CreateDelegate(pageTwoContext, () =>
        {
            pageTwoCalled = true;
            return new OkObjectResult(ApiResponse<string>.SuccessResult("page-2"));
        }));

        Assert.True(pageTwoCalled);
    }

    [Fact]
    public async Task Get_ShouldUseDifferentCacheEntries_ForDifferentUsers()
    {
        var filter = CreateFilter();

        var userOneContext = CreateContext("GET", "/api/v1/results/my", "?page=1", userId: "1");
        await filter.OnActionExecutionAsync(userOneContext, CreateDelegate(
            userOneContext,
            () => new OkObjectResult(ApiResponse<string>.SuccessResult("user-1"))));

        var userTwoContext = CreateContext("GET", "/api/v1/results/my", "?page=1", userId: "2");
        var userTwoCalled = false;
        await filter.OnActionExecutionAsync(userTwoContext, CreateDelegate(userTwoContext, () =>
        {
            userTwoCalled = true;
            return new OkObjectResult(ApiResponse<string>.SuccessResult("user-2"));
        }));

        Assert.True(userTwoCalled);
    }

    [Fact]
    public async Task Get_ShouldNotCacheFailureResponse()
    {
        var filter = CreateFilter();

        var firstContext = CreateContext("GET", "/api/v1/courses/404", string.Empty, userId: "1");
        await filter.OnActionExecutionAsync(firstContext, CreateDelegate(
            firstContext,
            () => new NotFoundObjectResult(ApiResponse<string>.FailureResult("missing"))));

        var secondContext = CreateContext("GET", "/api/v1/courses/404", string.Empty, userId: "1");
        var secondCalled = false;
        await filter.OnActionExecutionAsync(secondContext, CreateDelegate(secondContext, () =>
        {
            secondCalled = true;
            return new NotFoundObjectResult(ApiResponse<string>.FailureResult("missing"));
        }));

        Assert.True(secondCalled);
    }

    [Fact]
    public async Task Get_ShouldSkipCache_WhenNoApiCacheAttributeExists()
    {
        var filter = CreateFilter();

        var firstContext = CreateContext(
            "GET",
            "/api/v1/courses",
            string.Empty,
            userId: "1",
            nameof(DummyCacheController.NoCacheAction));
        await filter.OnActionExecutionAsync(firstContext, CreateDelegate(
            firstContext,
            () => new OkObjectResult(ApiResponse<string>.SuccessResult("first"))));

        var secondContext = CreateContext(
            "GET",
            "/api/v1/courses",
            string.Empty,
            userId: "1",
            nameof(DummyCacheController.NoCacheAction));
        var secondCalled = false;
        await filter.OnActionExecutionAsync(secondContext, CreateDelegate(secondContext, () =>
        {
            secondCalled = true;
            return new OkObjectResult(ApiResponse<string>.SuccessResult("second"));
        }));

        Assert.True(secondCalled);
    }

    private static ApiGetCacheFilter CreateFilter()
    {
        var memoryCache = new MemoryCache(new MemoryCacheOptions());
        var invalidator = new MemoryApiCacheInvalidator(memoryCache);
        var options = Options.Create(new ApiCacheOptions { Enabled = true, DefaultTtlSeconds = 300 });
        return new ApiGetCacheFilter(invalidator, options);
    }

    private static ActionExecutingContext CreateContext(
        string method,
        string path,
        string queryString,
        string userId,
        string actionName = nameof(DummyCacheController.CacheableAction),
        string role = "Student")
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = method;
        httpContext.Request.Path = path;
        httpContext.Request.QueryString = new QueryString(queryString);
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Role, role)
        }, "TestAuth"));

        var methodInfo = typeof(DummyCacheController).GetMethod(actionName)
            ?? throw new MissingMethodException(nameof(DummyCacheController), actionName);

        var actionDescriptor = new ControllerActionDescriptor
        {
            ControllerTypeInfo = typeof(DummyCacheController).GetTypeInfo(),
            MethodInfo = methodInfo,
            ActionName = actionName,
            ControllerName = nameof(DummyCacheController)
        };

        var actionContext = new ActionContext(httpContext, new RouteData(), actionDescriptor);
        return new ActionExecutingContext(
            actionContext,
            new List<IFilterMetadata>(),
            new Dictionary<string, object?>(),
            new DummyCacheController());
    }

    private static ActionExecutionDelegate CreateDelegate(ActionExecutingContext context, Func<IActionResult> resultFactory)
    {
        return () => Task.FromResult(new ActionExecutedContext(
            context,
            new List<IFilterMetadata>(),
            new DummyCacheController())
        {
            Result = resultFactory()
        });
    }

    private sealed class DummyCacheController
    {
        public void CacheableAction()
        {
        }

        [NoApiCache]
        public void NoCacheAction()
        {
        }
    }
}
