using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthorization();

app.MapStaticAssets();

app.MapGet("/js/core/runtime-config.js", (IConfiguration configuration) =>
{
    var backendApi = configuration.GetSection("BackendApi");
    var payload = new
    {
        apiBaseUrl = backendApi["BaseUrl"] ?? "https://localhost:7117/api/v1",
        backendReady = new
        {
            path = backendApi["ReadyPath"] ?? "/health/ready",
            retryIntervalMs = backendApi.GetValue("StartupRetryIntervalMs", 1500),
            retryMaxIntervalMs = backendApi.GetValue("StartupRetryMaxIntervalMs", 5000)
        }
    };

    var json = JsonSerializer.Serialize(payload);
    var script = "window.Lms = window.Lms || {};" +
        "var __lmsRuntimeConfig = " + json + ";" +
        "window.Lms.config = Object.assign({}, window.Lms.config || {}, __lmsRuntimeConfig);" +
        "window.Lms.config.backendReady = Object.assign({}, (window.Lms.config || {}).backendReady || {}, __lmsRuntimeConfig.backendReady);";

    return Results.Text(script, "application/javascript");
});

app.MapControllerRoute(
    name: "admin",
    pattern: "admin/{controller=Dashboard}/{action=Index}/{id?}",
    defaults: new { area = "Admin" })
    .WithStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run();
