using lms.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddLmsPersistence(builder.Configuration)
    .AddLmsApplication()
    .AddLmsInfrastructure()
    .AddLmsAuthentication(builder.Configuration)
    .AddLmsControllers()
    .AddLmsSwagger();

var app = builder.Build();

// Bắt mọi exception bubble và map sang ApiResponse + HTTP status chuẩn.
app.UseLmsExceptionHandling();

app.UseLmsSwagger();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Chạy migration + seed dữ liệu cơ bản.
await app.Services.MigrateAndSeedAsync();

app.Run();
