using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using lms.Application.DTOs.Courses;
using lms.Application.Interfaces.Services;
using lms.Application.Services;
using lms.Domain.Entities;
using lms.Persistence.Context;
using lms.Persistence.Repositories;

namespace lms.UnitTests;

public class CourseServiceTests
{
    private LmsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<LmsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new LmsDbContext(options);
    }

    [Fact]
    public async Task CreateCourse_ShouldSucceed()
    {
        // Arrange
        var context = CreateDbContext();
        var courseRepo = new CourseRepository(context);
        var auditMock = new Mock<IAuditLogService>();
        var courseService = new CourseService(courseRepo, auditMock.Object);

        // Act
        var result = await courseService.CreateCourseAsync(new CreateCourseRequest
        {
            Code = "MATH101",
            Name = "Introduction to Calculus",
            Description = "Calculus basic concepts",
            IsPublished = true
        }, adminId: 1);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal("MATH101", result.Data.Code);
    }

    [Fact]
    public async Task CreateCourse_ShouldFail_WhenCodeAlreadyExists()
    {
        // Arrange
        var context = CreateDbContext();
        var courseRepo = new CourseRepository(context);
        var auditMock = new Mock<IAuditLogService>();

        var existingCourse = new Course { Code = "MATH101", Name = "Existing", IsDelete = false };
        await courseRepo.AddAsync(existingCourse);

        var courseService = new CourseService(courseRepo, auditMock.Object);

        // Act
        var result = await courseService.CreateCourseAsync(new CreateCourseRequest
        {
            Code = "MATH101",
            Name = "New Course"
        }, adminId: 1);

        // Assert
        Assert.False(result.Success);
        Assert.Contains("đã tồn tại", result.Message);
    }

    [Fact]
    public async Task HasAccess_ShouldReturnTrue_WhenDirectlyAssigned()
    {
        // Arrange
        var context = CreateDbContext();
        var assignmentRepo = new CourseAssignmentRepository(context);
        var groupUserRepo = new GroupUserRepository(context);
        var groupAssignmentRepo = new GroupCourseAssignmentRepository(context);

        var studentId = 12;
        var courseId = 5;

        var assignment = new CourseAssignment { CourseId = courseId, UserId = studentId };
        await assignmentRepo.AddAsync(assignment);

        var accessService = new CourseAccessService(assignmentRepo, groupUserRepo, groupAssignmentRepo);

        // Act
        var result = await accessService.HasAccessAsync(studentId, courseId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task HasAccess_ShouldReturnTrue_WhenGroupAssigned()
    {
        // Arrange
        var context = CreateDbContext();
        var assignmentRepo = new CourseAssignmentRepository(context);
        var groupUserRepo = new GroupUserRepository(context);
        var groupAssignmentRepo = new GroupCourseAssignmentRepository(context);

        var studentId = 15;
        var groupId = 8;
        var courseId = 22;

        // Add user to group
        var groupUser = new GroupUser { GroupId = groupId, UserId = studentId };
        await groupUserRepo.AddAsync(groupUser);

        // Add group assignment to course
        var groupAssignment = new GroupCourseAssignment { GroupId = groupId, CourseId = courseId };
        await groupAssignmentRepo.AddAsync(groupAssignment);

        var accessService = new CourseAccessService(assignmentRepo, groupUserRepo, groupAssignmentRepo);

        // Act
        var result = await accessService.HasAccessAsync(studentId, courseId);

        // Assert
        Assert.True(result);
    }
}
