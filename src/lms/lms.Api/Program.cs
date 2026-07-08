using Microsoft.EntityFrameworkCore;
using lms.Api.Extensions;
using lms.Application.DTOs.Common;
using lms.Persistence.Context;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddLmsPersistence(builder.Configuration)
    .AddLmsApplication()
    .AddLmsInfrastructure()
    .AddLmsApiCache(builder.Configuration)
    .AddLmsAuthentication(builder.Configuration)
    .AddLmsControllers()
    .AddLmsCors()
    .AddLmsSwagger();

var app = builder.Build();
var isReady = false;

// Bắt mọi exception bubble và map sang ApiResponse + HTTP status chuẩn.
app.UseLmsExceptionHandling();

app.UseLmsSwagger();

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("LmsWebMvc");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health/live", () =>
{
    return Results.Ok(ApiResponse<object>.SuccessResult(new
    {
        status = "Live",
        checkedAt = DateTime.UtcNow
    }));
});

app.MapGet("/health/ready", async (LmsDbContext dbContext) =>
{
    if (!isReady)
    {
        return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
    }

    var canConnect = await dbContext.Database.CanConnectAsync();
    if (!canConnect)
    {
        return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
    }

    return Results.Ok(ApiResponse<object>.SuccessResult(new
    {
        status = "Ready",
        checkedAt = DateTime.UtcNow
    }));
});

app.MapControllers();

// Chạy migration + seed dữ liệu cơ bản.
await app.StartAsync();
await app.Services.MigrateAndSeedAsync();
isReady = true;

await app.WaitForShutdownAsync();
