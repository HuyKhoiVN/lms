using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;
using lms.Application.DTOs.Identity;
using lms.Application.Interfaces.Services;
using lms.Application.Services;
using lms.Domain.Entities;
using lms.Infrastructure.Services;
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

    private IConfiguration CreateConfiguration(Dictionary<string, string?>? values = null)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(values ?? new Dictionary<string, string?>
            {
                ["Jwt:RefreshTokenExpiryDays"] = "1"
            })
            .Build();
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

        var authService = new AuthService(userRepo, userRoleRepo, refreshRepo, hasherMock.Object, tokenMock.Object, auditMock.Object, CreateConfiguration());

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

        var authService = new AuthService(userRepo, userRoleRepo, refreshRepo, hasherMock.Object, tokenMock.Object, auditMock.Object, CreateConfiguration());

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

        var authService = new AuthService(userRepo, userRoleRepo, refreshRepo, hasherMock.Object, tokenMock.Object, auditMock.Object, CreateConfiguration());

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
    [Fact]
    public async Task Login_ShouldUseConfiguredRefreshTokenExpiry()
    {
        // Arrange
        var context = CreateDbContext();
        var userRepo = new UserRepository(context);
        var userRoleRepo = new UserRoleRepository(context);
        var refreshRepo = new RefreshTokenRepository(context);

        var hasherMock = new Mock<IPasswordHasherService>();
        hasherMock.Setup(h => h.VerifyPassword(It.IsAny<string>(), It.IsAny<string>())).Returns(true);

        var tokenMock = new Mock<ITokenService>();
        tokenMock.Setup(t => t.GenerateAccessToken(It.IsAny<User>(), It.IsAny<List<string>>())).Returns("access-token");
        tokenMock.Setup(t => t.GenerateRefreshToken()).Returns("refresh-token");

        var auditMock = new Mock<IAuditLogService>();
        var configuration = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Jwt:RefreshTokenExpiryDays"] = "1"
        });

        var user = new User
        {
            UserName = "expiryuser",
            PasswordHash = "hashedpassword",
            IsLocked = false,
            IsDelete = false
        };
        await userRepo.AddAsync(user);

        var authService = new AuthService(userRepo, userRoleRepo, refreshRepo, hasherMock.Object, tokenMock.Object, auditMock.Object, configuration);
        var beforeLogin = DateTime.UtcNow;

        // Act
        var result = await authService.LoginAsync(new LoginRequest { UserName = "expiryuser", Password = "password" });
        var token = await refreshRepo.GetByTokenAsync("refresh-token");

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(token);
        Assert.InRange(token!.Expires, beforeLogin.AddHours(23), beforeLogin.AddHours(25));
    }

    [Fact]
    public void TokenService_ShouldUseConfiguredAccessTokenExpiryMinutes()
    {
        // Arrange
        var configuration = CreateConfiguration(new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = "this_is_a_very_secret_key_for_lms_api_development_2026_06_25",
            ["Jwt:Issuer"] = "lms.Api",
            ["Jwt:Audience"] = "lms.WebMvc",
            ["Jwt:AccessTokenExpiryMinutes"] = "15"
        });
        var tokenService = new TokenService(configuration);
        var user = new User
        {
            Id = 1,
            UserName = "tokenuser",
            Email = "tokenuser@test.local",
            FullName = "Token User"
        };
        var beforeGenerate = DateTime.UtcNow;

        // Act
        var token = tokenService.GenerateAccessToken(user, new List<string> { "Student" });
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        // Assert
        Assert.InRange(jwt.ValidTo, beforeGenerate.AddMinutes(14), beforeGenerate.AddMinutes(16));
    }
}
