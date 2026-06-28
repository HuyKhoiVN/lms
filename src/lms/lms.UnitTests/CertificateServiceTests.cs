using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using lms.Application.DTOs.Certificates;
using lms.Application.Interfaces.Services;
using lms.Application.Services;
using lms.Domain.Entities;
using lms.Persistence.Context;
using lms.Persistence.Repositories;

namespace lms.UnitTests;

public class CertificateServiceTests
{
    private static LmsDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<LmsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new LmsDbContext(options);
    }

    [Fact]
    public async Task Generate_ShouldFail_WhenResultDoesNotPass()
    {
        var context = CreateDbContext();
        var service = CreateService(context);

        await context.ExamResults.AddAsync(new ExamResult
        {
            AttemptId = 1,
            ExamId = 2,
            UserId = 3,
            Score = 40,
            Passed = false,
            CompletedDate = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var result = await service.GenerateAsync(new GenerateCertificateRequest { ResultId = 1 }, adminId: 9);

        Assert.False(result.Success);
        Assert.Contains("Chi tao", result.Message);
    }

    [Fact]
    public async Task Generate_ShouldFail_WhenCertificateAlreadyExists()
    {
        var context = CreateDbContext();
        var service = CreateService(context);

        await context.ExamResults.AddAsync(new ExamResult
        {
            Id = 10,
            AttemptId = 1,
            ExamId = 2,
            UserId = 3,
            Score = 90,
            Passed = true,
            CompletedDate = DateTime.UtcNow
        });
        await context.Certificates.AddAsync(new Certificate
        {
            UserId = 3,
            ExamId = 2,
            CertificateCode = "CERT-EXISTING",
            IssuedDate = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var result = await service.GenerateAsync(new GenerateCertificateRequest { ResultId = 10 }, adminId: 9);

        Assert.False(result.Success);
        Assert.Contains("da ton tai", result.Message);
    }

    [Fact]
    public async Task Student_ShouldOnlySeeOwnCertificates()
    {
        var context = CreateDbContext();
        var service = CreateService(context);

        await context.Certificates.AddRangeAsync(
            new Certificate { UserId = 1, ExamId = 10, CertificateCode = "CERT-1", IssuedDate = DateTime.UtcNow },
            new Certificate { UserId = 2, ExamId = 10, CertificateCode = "CERT-2", IssuedDate = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var result = await service.GetPagedAsync(new CertificateFilterRequest(), requestingUserId: 1, isAdmin: false);

        Assert.True(result.Success);
        Assert.Single(result.Data!.Items);
        Assert.Equal(1, result.Data.Items[0].UserId);
    }

    private static CertificateService CreateService(LmsDbContext context)
    {
        var storage = new Mock<IFileStorageService>();
        storage.Setup(x => x.SaveFileAsync(It.IsAny<Stream>(), It.IsAny<string>()))
            .ReturnsAsync("certificate-test.html");

        var audit = new Mock<IAuditLogService>();

        return new CertificateService(
            new CertificateRepository(context),
            new CertificateFileRepository(context),
            new ExamResultRepository(context),
            new ExamRepository(context),
            new UserRepository(context),
            storage.Object,
            audit.Object);
    }
}
