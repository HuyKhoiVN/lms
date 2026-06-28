using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using lms.Application.Common.Time;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Api.Extensions;

public static class SeedExtensions
{
    /// <summary>
    /// Chạy migration mới nhất và seed dữ liệu khởi tạo (3 role + admin mặc định).
    /// Lỗi seed được log nhưng không làm crash app (tránh tự hủy môi trường dev).
    /// </summary>
    public static async Task MigrateAndSeedAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var logger = sp.GetRequiredService<ILogger<LmsDbContext>>();

        try
        {
            var context = sp.GetRequiredService<LmsDbContext>();
            await context.Database.MigrateAsync();

            var roleRepo = sp.GetRequiredService<IRoleRepository>();
            var userRepo = sp.GetRequiredService<IUserRepository>();
            var userRoleService = sp.GetRequiredService<IUserRoleService>();
            var hasher = sp.GetRequiredService<IPasswordHasherService>();
            var clock = sp.GetRequiredService<IClock>();

            await EnsureRoleAsync(roleRepo, "Admin", "System Administrator Role");
            await EnsureRoleAsync(roleRepo, "Student", "Student Role");
            await EnsureRoleAsync(roleRepo, "System", "System Services Role");

            if (!await userRepo.HasUsersAsync())
            {
                var admin = new User
                {
                    UserName = "admin",
                    FullName = "System Administrator",
                    Email = "admin@lms.com",
                    PasswordHash = hasher.HashPassword("123456"),
                    IsLocked = false,
                    IsDelete = false,
                    CreatedDate = clock.UtcNow
                };

                await userRepo.AddAsync(admin);
                await userRoleService.AssignRoleAsync(admin.Id, "Admin");
                logger.LogInformation("Default admin user seeded.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred during database migration or seeding.");
        }
    }

    private static async Task EnsureRoleAsync(IRoleRepository roleRepo, string name, string description)
    {
        var existing = await roleRepo.GetByNameAsync(name);
        if (existing != null)
        {
            return;
        }

        await roleRepo.AddAsync(new Role { Name = name, Description = description });
    }
}
