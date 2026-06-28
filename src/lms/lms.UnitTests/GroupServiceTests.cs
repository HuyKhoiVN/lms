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

public class GroupServiceTests
{
    private LmsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<LmsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new LmsDbContext(options);
    }

    [Fact]
    public async Task CreateGroup_ShouldSucceed()
    {
        // Arrange
        var context = CreateDbContext();
        var groupRepo = new GroupRepository(context);
        
        var currentUserServiceMock = new Mock<ICurrentUserService>();
        currentUserServiceMock.Setup(x => x.UserId).Returns(1);

        var auditMock = new Mock<IAuditLogService>();

        var groupService = new GroupService(groupRepo, currentUserServiceMock.Object, auditMock.Object);

        // Act
        var result = await groupService.CreateGroupAsync(new CreateGroupRequest
        {
            Name = "Class 10A",
            Description = "Grade 10 Math class"
        });

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal("Class 10A", result.Data.Name);
    }

    [Fact]
    public async Task CreateGroup_ShouldFail_WhenNameAlreadyExists()
    {
        // Arrange
        var context = CreateDbContext();
        var groupRepo = new GroupRepository(context);

        var currentUserServiceMock = new Mock<ICurrentUserService>();
        var auditMock = new Mock<IAuditLogService>();

        var existingGroup = new Group { Name = "Class 10A", IsDelete = false };
        await groupRepo.AddAsync(existingGroup);

        var groupService = new GroupService(groupRepo, currentUserServiceMock.Object, auditMock.Object);

        // Act
        var result = await groupService.CreateGroupAsync(new CreateGroupRequest { Name = "Class 10A" });

        // Assert
        Assert.False(result.Success);
        Assert.Contains("đã tồn tại", result.Message);
    }

    [Fact]
    public async Task AddMember_ShouldSucceed()
    {
        // Arrange
        var context = CreateDbContext();
        var groupRepo = new GroupRepository(context);
        var userRepo = new UserRepository(context);
        var groupUserRepo = new GroupUserRepository(context);

        var currentUserServiceMock = new Mock<ICurrentUserService>();
        var auditMock = new Mock<IAuditLogService>();

        var group = new Group { Name = "Math Group", IsDelete = false };
        await groupRepo.AddAsync(group);

        var user = new User { UserName = "student1", IsLocked = false, IsDelete = false };
        await userRepo.AddAsync(user);

        var groupMemberService = new GroupMemberService(groupRepo, userRepo, groupUserRepo, currentUserServiceMock.Object, auditMock.Object);

        // Act
        var result = await groupMemberService.AddMemberAsync(group.Id, new AddGroupUserRequest { UserId = user.Id });

        // Assert
        Assert.True(result.Success);
        var relation = await groupUserRepo.GetByGroupIdAndUserIdAsync(group.Id, user.Id);
        Assert.NotNull(relation);
    }
}
