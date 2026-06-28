using Microsoft.AspNetCore.Builder;
using lms.Api.Middlewares;

namespace lms.Api.Extensions;

public static class ApplicationBuilderExtensions
{
    /// <summary>
    /// Đặt <see cref="ExceptionHandlingMiddleware"/> ở vị trí đầu pipeline.
    /// </summary>
    public static IApplicationBuilder UseLmsExceptionHandling(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ExceptionHandlingMiddleware>();
    }

    /// <summary>
    /// Bật Swagger + Swagger UI tại /swagger.
    /// </summary>
    public static IApplicationBuilder UseLmsSwagger(this IApplicationBuilder app)
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "LMS API v1");
            c.DocumentTitle = "LMS API";
        });
        return app;
    }
}
