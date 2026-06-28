using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using lms.Application.DTOs.Users;
using lms.Application.Interfaces.Services;
using lms.Application.Services;
using lms.Domain.Entities;
using lms.Persistence.Context;
using lms.Persistence.Repositories;

namespace lms.UnitTests;

public class UserServiceTests
{
    private LmsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<LmsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new LmsDbContext(options);
    }

    [Fact]
    public async Task CreateUser_ShouldFail_WhenUsernameAlreadyExists()
    {
        // Arrange
        var context = CreateDbContext();
        var userRepo = new UserRepository(context);
        var userRoleRepo = new UserRoleRepository(context);

        var userRoleServiceMock = new Mock<IUserRoleService>();
        var hasherMock = new Mock<IPasswordHasherService>();
        var auditMock = new Mock<IAuditLogService>();

        var existingUser = new User
        {
            UserName = "duplicateuser",
            Email = "existing@lms.com",
            IsLocked = false,
            IsDelete = false
        };
        await userRepo.AddAsync(existingUser);

        var userService = new UserService(userRepo, userRoleRepo, userRoleServiceMock.Object, hasherMock.Object, auditMock.Object);

        // Act
        var result = await userService.CreateUserAsync(new CreateUserRequest
        {
            UserName = "duplicateuser",
            FullName = "New User",
            Email = "new@lms.com",
            Role = "Student"
        }, adminId: 1);

        // Assert
        Assert.False(result.Success);
        Assert.Contains("đã tồn tại", result.Message);
    }

    [Fact]
    public async Task DeleteUser_ShouldFail_WhenTryingToDeleteSelf()
    {
        // Arrange
        var context = CreateDbContext();
        var userRepo = new UserRepository(context);
        var userRoleRepo = new UserRoleRepository(context);

        var userRoleServiceMock = new Mock<IUserRoleService>();
        var hasherMock = new Mock<IPasswordHasherService>();
        var auditMock = new Mock<IAuditLogService>();

        var adminUser = new User
        {
            UserName = "admin",
            IsLocked = false,
            IsDelete = false
        };
        await userRepo.AddAsync(adminUser);

        var userService = new UserService(userRepo, userRoleRepo, userRoleServiceMock.Object, hasherMock.Object, auditMock.Object);

        // Act
        var result = await userService.DeleteUserAsync(adminUser.Id, adminId: adminUser.Id);

        // Assert
        Assert.False(result.Success);
        Assert.Contains("chính mình", result.Message);
    }

    [Fact]
    public async Task LockUser_ShouldSucceed()
    {
        // Arrange
        var context = CreateDbContext();
        var userRepo = new UserRepository(context);
        var userRoleRepo = new UserRoleRepository(context);

        var userRoleServiceMock = new Mock<IUserRoleService>();
        var hasherMock = new Mock<IPasswordHasherService>();
        var auditMock = new Mock<IAuditLogService>();

        var user = new User
        {
            UserName = "studentuser",
            IsLocked = false,
            IsDelete = false
        };
        await userRepo.AddAsync(user);

        var userService = new UserService(userRepo, userRoleRepo, userRoleServiceMock.Object, hasherMock.Object, auditMock.Object);

        // Act
        var result = await userService.LockUserAsync(user.Id, "Break rules", adminId: 99);

        // Assert
        Assert.True(result.Success);
        var updatedUser = await userRepo.GetByIdAsync(user.Id);
        Assert.NotNull(updatedUser);
        Assert.True(updatedUser.IsLocked);
    }
}
