using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using lms.Application.DTOs.Identity;
using lms.Application.Interfaces.Services;
using lms.Application.Services;
using lms.Domain.Entities;
using lms.Persistence.Context;
using lms.Persistence.Repositories;

namespace lms.UnitTests;

public class AuthServiceTests
{
    private LmsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<LmsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new LmsDbContext(options);
    }

    [Fact]
    public async Task Login_ShouldFail_WhenPasswordIsIncorrect()
    {
        // Arrange
        var context = CreateDbContext();
        var userRepo = new UserRepository(context);
        var userRoleRepo = new UserRoleRepository(context);
        var refreshRepo = new RefreshTokenRepository(context);

        var hasherMock = new Mock<IPasswordHasherService>();
        hasherMock.Setup(h => h.VerifyPassword(It.IsAny<string>(), It.IsAny<string>())).Returns(false);

        var tokenMock = new Mock<ITokenService>();
        var auditMock = new Mock<IAuditLogService>();

        var user = new User
        {
            UserName = "testuser",
            PasswordHash = "hashedpassword",
            IsLocked = false,
            IsDelete = false
        };
        await userRepo.AddAsync(user);

        var authService = new AuthService(userRepo, userRoleRepo, refreshRepo, hasherMock.Object, tokenMock.Object, auditMock.Object);

        // Act
        var result = await authService.LoginAsync(new LoginRequest { UserName = "testuser", Password = "wrongpassword" });

        // Assert
        Assert.False(result.Success);
        Assert.Contains("không chính xác", result.Message);
    }

    [Fact]
    public async Task Login_ShouldFail_WhenUserIsLocked()
    {
        // Arrange
        var context = CreateDbContext();
        var userRepo = new UserRepository(context);
        var userRoleRepo = new UserRoleRepository(context);
        var refreshRepo = new RefreshTokenRepository(context);

        var hasherMock = new Mock<IPasswordHasherService>();
        hasherMock.Setup(h => h.VerifyPassword(It.IsAny<string>(), It.IsAny<string>())).Returns(true);

        var tokenMock = new Mock<ITokenService>();
        var auditMock = new Mock<IAuditLogService>();

        var user = new User
        {
            UserName = "lockeduser",
            PasswordHash = "hashedpassword",
            IsLocked = true,
            IsDelete = false
        };
        await userRepo.AddAsync(user);

        var authService = new AuthService(userRepo, userRoleRepo, refreshRepo, hasherMock.Object, tokenMock.Object, auditMock.Object);

        // Act
        var result = await authService.LoginAsync(new LoginRequest { UserName = "lockeduser", Password = "password" });

        // Assert
        Assert.False(result.Success);
        Assert.Contains("bị khóa", result.Message);
    }

    [Fact]
    public async Task ChangePassword_ShouldFail_WhenOldPasswordIsIncorrect()
    {
        // Arrange
        var context = CreateDbContext();
        var userRepo = new UserRepository(context);
        var userRoleRepo = new UserRoleRepository(context);
        var refreshRepo = new RefreshTokenRepository(context);

        var hasherMock = new Mock<IPasswordHasherService>();
        hasherMock.Setup(h => h.VerifyPassword("wrongold", It.IsAny<string>())).Returns(false);

        var tokenMock = new Mock<ITokenService>();
        var auditMock = new Mock<IAuditLogService>();

        var user = new User
        {
            UserName = "changepassuser",
            PasswordHash = "hashedpassword",
            IsLocked = false,
            IsDelete = false
        };
        await userRepo.AddAsync(user);

        var authService = new AuthService(userRepo, userRoleRepo, refreshRepo, hasherMock.Object, tokenMock.Object, auditMock.Object);

        // Act
        var result = await authService.ChangePasswordAsync(user.Id, new ChangePasswordRequest
        {
            OldPassword = "wrongold",
            NewPassword = "newpassword"
        });

        // Assert
        Assert.False(result.Success);
        Assert.Contains("không chính xác", result.Message);
    }
}
