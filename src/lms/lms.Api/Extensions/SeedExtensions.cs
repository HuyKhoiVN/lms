using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Globalization;
using System.Text;
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
            var fileStorage = sp.GetRequiredService<IFileStorageService>();

            await EnsureRoleAsync(roleRepo, clock, "Admin", "Vai trò quản trị hệ thống");
            await EnsureRoleAsync(roleRepo, clock, "Student", "Vai trò học viên");
            await EnsureRoleAsync(roleRepo, clock, "System", "Vai trò dịch vụ hệ thống");

            var admin = await EnsureUserAsync(
                userRepo, userRoleService, hasher, clock,
                "admin", "Quản trị hệ thống", "admin@lms.com", "123456", "Admin");

            await EnsureUserAsync(
                userRepo, userRoleService, hasher, clock,
                "seed.system", "Dịch vụ đồng bộ dữ liệu", "seed.system@lms.local", "123456", "System");

            var students = new[]
            {
                await EnsureUserAsync(userRepo, userRoleService, hasher, clock, "huyen.nguyen", "Nguyễn Thu Huyền", "huyen.nguyen@lms.local", "123456", "Student"),
                await EnsureUserAsync(userRepo, userRoleService, hasher, clock, "minh.tran", "Trần Quang Minh", "minh.tran@lms.local", "123456", "Student"),
                await EnsureUserAsync(userRepo, userRoleService, hasher, clock, "lan.pham", "Phạm Ngọc Lan", "lan.pham@lms.local", "123456", "Student"),
                await EnsureUserAsync(userRepo, userRoleService, hasher, clock, "an.vo", "Võ Hoàng An", "an.vo@lms.local", "123456", "Student")
            };

            await SeedGroupsAsync(context, admin.Id, clock, students);
            await SeedCatalogAsync(context, admin.Id, clock);
            await SeedLearningPathsAsync(context, admin.Id, clock, students);
            await SeedExamRuntimeAsync(context, admin.Id, clock, students, fileStorage);
            await SeedAuditLogsAsync(context, admin.Id, clock, students);

            logger.LogInformation("Development seed data ensured successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred during database migration or seeding.");
        }
    }

    private static async Task EnsureRoleAsync(IRoleRepository roleRepo, IClock clock, string name, string description)
    {
        var existing = await roleRepo.GetByNameAsync(name);
        if (existing != null)
        {
            if (existing.Description != description)
            {
                existing.Description = description;
                existing.UpdateDate = clock.UtcNow;
                await roleRepo.UpdateAsync(existing);
            }

            return;
        }

        await roleRepo.AddAsync(new Role { Name = name, Description = description });
    }

    private static string DemoKey(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Trim().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            builder.Append(c switch
            {
                'đ' => 'd',
                'Đ' => 'D',
                _ => c
            });
        }

        return builder.ToString().Normalize(NormalizationForm.FormC).ToUpperInvariant();
    }

    private static async Task<User> EnsureUserAsync(
        IUserRepository userRepo,
        IUserRoleService userRoleService,
        IPasswordHasherService hasher,
        IClock clock,
        string userName,
        string fullName,
        string email,
        string password,
        string roleName)
    {
        var existing = await userRepo.GetByUserNameAsync(userName);
        if (existing != null)
        {
            existing.FullName = fullName;
            existing.Email = email;
            existing.IsLocked = false;
            existing.IsDelete = false;
            await userRepo.UpdateAsync(existing);
            await userRoleService.AssignRoleAsync(existing.Id, roleName);
            return existing;
        }

        var user = new User
        {
            UserName = userName,
            FullName = fullName,
            Email = email,
            PasswordHash = hasher.HashPassword(password),
            IsLocked = false,
            IsDelete = false,
            CreatedDate = clock.UtcNow
        };

        await userRepo.AddAsync(user);
        await userRoleService.AssignRoleAsync(user.Id, roleName);
        return user;
    }

    private static async Task SeedGroupsAsync(LmsDbContext context, int adminId, IClock clock, IReadOnlyList<User> students)
    {
        var now = clock.UtcNow;

        var businessGroup = await EnsureGroupAsync(
            context, adminId, now,
            "Lớp Kinh doanh số K24",
            "Học viên đang học các chủ đề về vận hành, dịch vụ và kỹ năng khách hàng.");

        var analyticsGroup = await EnsureGroupAsync(
            context, adminId, now,
            "Lớp Phân tích dữ liệu K24",
            "Học viên tập trung vào kỹ năng xử lý dữ liệu, báo cáo và làm việc với dashboard.");

        await EnsureGroupUserAsync(context, businessGroup.Id, students[0].Id);
        await EnsureGroupUserAsync(context, businessGroup.Id, students[2].Id);
        await EnsureGroupUserAsync(context, analyticsGroup.Id, students[1].Id);
        await EnsureGroupUserAsync(context, analyticsGroup.Id, students[3].Id);

        await context.SaveChangesAsync();
    }

    private static async Task SeedCatalogAsync(LmsDbContext context, int adminId, IClock clock)
    {
        var now = clock.UtcNow;

        var courseAgile = await EnsureCourseAsync(
            context, adminId, now,
            "LMS-AGILE-01",
            "Nhập môn Quản trị dự án Agile",
            "Giới thiệu Scrum, vai trò trong dự án và cách tổ chức sprint cho nhóm nhỏ.",
            true);

        var courseExcel = await EnsureCourseAsync(
            context, adminId, now,
            "LMS-EXCEL-01",
            "Phân tích dữ liệu với Excel cho người đi làm",
            "Tổng hợp kỹ năng làm sạch dữ liệu, PivotTable, hàm thống kê và trình bày báo cáo.",
            true);

        var courseService = await EnsureCourseAsync(
            context, adminId, now,
            "LMS-CSKH-01",
            "Kỹ năng chăm sóc khách hàng đa kênh",
            "Dành cho nhân sự vận hành và CSKH, tập trung vào phản hồi tình huống và xử lý khiếu nại.",
            true);

        await EnsureMaterialAsync(
            context, adminId, now, courseAgile.Id,
            "Tư duy Agile trong doanh nghiệp nhỏ", "Text", 1,
            """
Agile không chỉ là một quy trình phát triển phần mềm. Trong doanh nghiệp nhỏ, Agile là cách làm việc theo từng chu kỳ ngắn, ưu tiên giá trị sớm và phản hồi liên tục.

Ba điểm cần nhớ:
1. Chia mục tiêu lớn thành đầu việc có thể hoàn thành trong 1-2 tuần.
2. Mỗi việc cần có người chịu trách nhiệm rõ ràng và tiêu chí xong việc cụ thể.
3. Sau mỗi chu kỳ, nhóm cần nhìn lại điều gì làm tốt, điều gì cần điều chỉnh.
""",
            null,
            durationMinutes: 12);

        await EnsureMaterialAsync(
            context, adminId, now, courseAgile.Id,
            "Mẫu Sprint Planning cho nhóm 5 người", "Link", 2,
            null,
            "https://scrumguides.org",
            durationMinutes: 8);

        await EnsureMaterialAsync(
            context, adminId, now, courseExcel.Id,
            "Làm sạch dữ liệu bán hàng trước khi báo cáo", "Text", 1,
            """
Khi nhận file doanh số từ các chi nhánh, cần kiểm tra 4 nhóm lỗi phổ biến:
- Trùng mã khách hàng
- Sai định dạng ngày tháng
- Cột doanh thu đang ở dạng text
- Giá trị thiếu ở cột kênh bán

Quy trình đề xuất:
1. Tạo bản sao dữ liệu gốc.
2. Chuẩn hóa ngày tháng theo một format duy nhất.
3. Dùng TRIM, CLEAN và VALUE để chuẩn hóa cột kỹ thuật.
4. Kiểm tra bằng PivotTable trước khi đưa vào dashboard.
""",
            null,
            durationMinutes: 15);

        await EnsureMaterialAsync(
            context, adminId, now, courseExcel.Id,
            "Hướng dẫn PivotTable và slicer cho báo cáo tháng", "Text", 2,
            """
PivotTable phù hợp khi cần tổng hợp nhanh theo khu vực, nhân viên bán hàng và nhóm sản phẩm.

Khi trình bày báo cáo:
- Đặt slicer cho tháng, khu vực và kênh bán
- Giữ tên chỉ số ngắn gọn và dễ hiểu
- Hiển thị tổng doanh thu, số đơn và giá trị đơn trung bình ở cùng một màn hình
""",
            null,
            durationMinutes: 10);

        await EnsureMaterialAsync(
            context, adminId, now, courseService.Id,
            "Quy trình tiếp nhận và phản hồi khiếu nại 3 bước", "Text", 1,
            """
Bước 1: Lắng nghe và xác nhận lại vấn đề của khách hàng.
Bước 2: Kiểm tra thông tin đơn hàng, lịch sử tương tác và mức độ ảnh hưởng.
Bước 3: Đưa ra hướng xử lý có hạn thời gian rõ ràng, sau đó chủ động cập nhật kết quả.

Mục tiêu là giảm căng thẳng cho khách hàng, không tranh cãi và không để cuộc gọi kết thúc trong mơ hồ.
""",
            null,
            durationMinutes: 9);

        var catAgile = await EnsureCategoryAsync(
            context, adminId, now,
            "Agile Scrum",
            "Danh mục câu hỏi liên quan đến Scrum, sprint và vai trò trong nhóm.");

        var catExcel = await EnsureCategoryAsync(
            context, adminId, now,
            "Excel Báo cáo",
            "Câu hỏi về xử lý dữ liệu, PivotTable và trình bày báo cáo.");

        var catService = await EnsureCategoryAsync(
            context, adminId, now,
            "Chăm sóc khách hàng",
            "Tình huống tiếp nhận phản hồi và xử lý khi khiếu nại.");

        var q1 = await EnsureQuestionAsync(
            context, adminId, now, catAgile.Id,
            "Trong Scrum, ai là người chịu trách nhiệm tối ưu giá trị của Product Backlog?",
            "SingleChoice", "Easy", 1, 10m,
            new[]
            {
                ("Product Owner", true),
                ("Scrum Master", false),
                ("Developer", false),
                ("Khách hàng bất kỳ", false)
            });

        var q2 = await EnsureQuestionAsync(
            context, adminId, now, catAgile.Id,
            "Mục tiêu chính của buổi Sprint Retrospective là gì?",
            "SingleChoice", "Medium", 2, 10m,
            new[]
            {
                ("Đánh giá cách nhóm đã làm việc và thống nhất cải tiến cho sprint sau", true),
                ("Phê duyệt ngân sách dự án", false),
                ("Công bố doanh thu tháng", false),
                ("Bàn giao sản phẩm cho phòng kế toán", false)
            });

        var q3 = await EnsureQuestionAsync(
            context, adminId, now, catExcel.Id,
            "Công cụ nào trong Excel phù hợp nhất để tổng hợp doanh thu theo khu vực và tháng?",
            "SingleChoice", "Easy", 1, 10m,
            new[]
            {
                ("PivotTable", true),
                ("Find and Replace", false),
                ("Page Layout", false),
                ("Conditional Formatting", false)
            });

        var q4 = await EnsureQuestionAsync(
            context, adminId, now, catExcel.Id,
            "Khi một cột doanh thu đang ở dạng text, hàm nào thường dùng để chuyển về dạng số?",
            "SingleChoice", "Medium", 2, 10m,
            new[]
            {
                ("VALUE", true),
                ("LEFT", false),
                ("COUNTIF", false),
                ("TEXTJOIN", false)
            });

        var q5 = await EnsureQuestionAsync(
            context, adminId, now, catService.Id,
            "Khi khách hàng đang bức xúc, phản hồi đầu tiên phù hợp nhất là gì?",
            "SingleChoice", "Easy", 1, 10m,
            new[]
            {
                ("Lắng nghe, xác nhận vấn đề và cho khách hàng thấy mình đang tiếp nhận nghiêm túc", true),
                ("Yêu cầu khách gửi email rồi kết thúc cuộc gọi", false),
                ("Tranh luận để bảo vệ quy trình nội bộ", false),
                ("Chuyển máy ngay lập tức mà không nói gì", false)
            });

        var q6 = await EnsureQuestionAsync(
            context, adminId, now, catService.Id,
            "Bước nào giúp giảm nguy cơ khách hàng phải gọi lại nhiều lần?",
            "SingleChoice", "Medium", 2, 10m,
            new[]
            {
                ("Cam kết thời gian phản hồi và chủ động cập nhật tiến độ xử lý", true),
                ("Chỉ ghi chú nội bộ mà không thông báo cho khách", false),
                ("Hẹn khách đợi vô thời hạn", false),
                ("Nói rằng phòng ban khác sẽ tự liên hệ", false)
            });

        var examAgile = await EnsureExamAsync(
            context, adminId, now,
            "EX-AGILE-01",
            "Kiểm tra nhận thức Agile căn bản",
            "Đánh giá khả năng nắm bắt các khái niệm cơ bản trong Scrum và cách vận dụng trong nhóm nhỏ.",
            25, 70m, "FullReview", true);

        var examExcel = await EnsureExamAsync(
            context, adminId, now,
            "EX-EXCEL-01",
            "Kiểm tra phân tích dữ liệu với Excel",
            "Đánh giá kiến thức làm sạch dữ liệu và tổng hợp báo cáo doanh số.",
            30, 70m, "FullReview", true);

        var examService = await EnsureExamAsync(
            context, adminId, now,
            "EX-CSKH-01",
            "Kiểm tra xử lý tình huống chăm sóc khách hàng",
            "Đánh giá khả năng tiếp nhận, phản hồi và theo dõi khi khiếu nại.",
            20, 70m, "AnswerOnly", true);

        await EnsureCourseExamAsync(context, courseAgile.Id, examAgile.Id, 1);
        await EnsureCourseExamAsync(context, courseExcel.Id, examExcel.Id, 1);
        await EnsureCourseExamAsync(context, courseService.Id, examService.Id, 1);

        await EnsureExamQuestionAsync(context, examAgile.Id, q1.Id, 10m, 1);
        await EnsureExamQuestionAsync(context, examAgile.Id, q2.Id, 10m, 2);
        await EnsureExamQuestionAsync(context, examExcel.Id, q3.Id, 10m, 1);
        await EnsureExamQuestionAsync(context, examExcel.Id, q4.Id, 10m, 2);
        await EnsureExamQuestionAsync(context, examService.Id, q5.Id, 10m, 1);
        await EnsureExamQuestionAsync(context, examService.Id, q6.Id, 10m, 2);

        await context.SaveChangesAsync();
    }

    private static async Task SeedLearningPathsAsync(LmsDbContext context, int adminId, IClock clock, IReadOnlyList<User> students)
    {
        var now = clock.UtcNow;
        var courses = await context.Courses.Where(x => !x.IsDelete).ToListAsync();
        var groups = await context.Groups.Where(x => !x.IsDelete).ToListAsync();
        var materials = await context.LearningMaterials.Where(x => !x.IsDelete).OrderBy(x => x.CourseId).ThenBy(x => x.Order).ToListAsync();
        var exams = await context.Exams.Where(x => !x.IsDelete).ToListAsync();

        var courseAgile = courses.First(x => x.Code == "LMS-AGILE-01");
        var courseExcel = courses.First(x => x.Code == "LMS-EXCEL-01");
        var courseService = courses.First(x => x.Code == "LMS-CSKH-01");
        var groupBusiness = groups.First(x => DemoKey(x.Name) == DemoKey("Lớp Kinh doanh số K24"));
        var groupAnalytics = groups.First(x => DemoKey(x.Name) == DemoKey("Lớp Phân tích dữ liệu K24"));

        await EnsureCourseAssignmentAsync(context, courseAgile.Id, students[0].Id);
        await EnsureCourseAssignmentAsync(context, courseExcel.Id, students[1].Id);
        await EnsureCourseAssignmentAsync(context, courseService.Id, students[2].Id);
        await EnsureCourseAssignmentAsync(context, courseExcel.Id, students[3].Id);

        await EnsureGroupCourseAssignmentAsync(context, groupBusiness.Id, courseService.Id);
        await EnsureGroupCourseAssignmentAsync(context, groupAnalytics.Id, courseExcel.Id);

        var examAgile = exams.First(x => x.Code == "EX-AGILE-01");
        var examExcel = exams.First(x => x.Code == "EX-EXCEL-01");
        var examService = exams.First(x => x.Code == "EX-CSKH-01");

        await EnsureExamAssignmentAsync(context, examAgile.Id, students[0].Id, now.AddDays(-15), now.AddDays(30));
        await EnsureExamAssignmentAsync(context, examExcel.Id, students[1].Id, now.AddDays(-15), now.AddDays(30));
        await EnsureExamAssignmentAsync(context, examService.Id, students[2].Id, now.AddDays(-15), now.AddDays(30));
        await EnsureExamAssignmentAsync(context, examExcel.Id, students[3].Id, now.AddDays(-15), now.AddDays(30));

        await EnsureGroupExamAssignmentAsync(context, examService.Id, groupBusiness.Id, now.AddDays(-15), now.AddDays(30));
        await EnsureGroupExamAssignmentAsync(context, examExcel.Id, groupAnalytics.Id, now.AddDays(-15), now.AddDays(30));

        foreach (var material in materials.Where(x => x.CourseId == courseAgile.Id))
        {
            await EnsureLearningProgressAsync(context, adminId, now, students[0].Id, courseAgile.Id, material.Id, 100m, true, now.AddDays(-7));
        }

        foreach (var material in materials.Where(x => x.CourseId == courseExcel.Id && x.Order == 1))
        {
            await EnsureLearningProgressAsync(context, adminId, now, students[1].Id, courseExcel.Id, material.Id, 100m, true, now.AddDays(-5));
        }

        foreach (var material in materials.Where(x => x.CourseId == courseExcel.Id && x.Order == 2))
        {
            await EnsureLearningProgressAsync(context, adminId, now, students[1].Id, courseExcel.Id, material.Id, 60m, false, null);
        }

        foreach (var material in materials.Where(x => x.CourseId == courseService.Id))
        {
            await EnsureLearningProgressAsync(context, adminId, now, students[2].Id, courseService.Id, material.Id, 100m, true, now.AddDays(-4));
        }

        var huyenServiceMaterial = materials
            .Where(x => x.CourseId == courseService.Id)
            .OrderBy(x => x.Order)
            .FirstOrDefault();
        if (huyenServiceMaterial != null)
        {
            await EnsureLearningProgressAsync(context, adminId, now, students[0].Id, courseService.Id, huyenServiceMaterial.Id, 40m, false, null);
        }

        await context.SaveChangesAsync();
    }

    private static async Task SeedExamRuntimeAsync(
        LmsDbContext context,
        int adminId,
        IClock clock,
        IReadOnlyList<User> students,
        IFileStorageService fileStorage)
    {
        var now = clock.UtcNow;
        var exams = await context.Exams.Where(x => !x.IsDelete).ToListAsync();
        var examQuestions = await context.ExamQuestions.ToListAsync();
        var questions = await context.Questions.Where(x => !x.IsDelete).ToListAsync();
        var answerOptions = await context.AnswerOptions.Where(x => !x.IsDelete).ToListAsync();

        var examAgile = exams.First(x => x.Code == "EX-AGILE-01");
        var examExcel = exams.First(x => x.Code == "EX-EXCEL-01");
        var examService = exams.First(x => x.Code == "EX-CSKH-01");

        await EnsureCompletedAttemptAsync(context, adminId, now, fileStorage, students[0], examAgile,
            examQuestions.Where(x => x.ExamId == examAgile.Id).ToList(), questions, answerOptions,
            new Dictionary<string, bool>
            {
                ["Trong Scrum, ai là người chịu trách nhiệm tối ưu giá trị của Product Backlog?"] = true,
                ["Mục tiêu chính của buổi Sprint Retrospective là gì?"] = true
            },
            startedAt: now.AddDays(-7).AddHours(-1),
            submittedAt: now.AddDays(-7),
            durationMinutes: 18);

        await EnsureCompletedAttemptAsync(context, adminId, now, fileStorage, students[1], examExcel,
            examQuestions.Where(x => x.ExamId == examExcel.Id).ToList(), questions, answerOptions,
            new Dictionary<string, bool>
            {
                ["Công cụ nào trong Excel phù hợp nhất để tổng hợp doanh thu theo khu vực và tháng?"] = true,
                ["Khi một cột doanh thu đang ở dạng text, hàm nào thường dùng để chuyển về dạng số?"] = false
            },
            startedAt: now.AddDays(-5).AddHours(-1),
            submittedAt: now.AddDays(-5),
            durationMinutes: 24);

        await EnsureCompletedAttemptAsync(context, adminId, now, fileStorage, students[2], examService,
            examQuestions.Where(x => x.ExamId == examService.Id).ToList(), questions, answerOptions,
            new Dictionary<string, bool>
            {
                ["Khi khách hàng đang bức xúc, phản hồi đầu tiên phù hợp nhất là gì?"] = true,
                ["Bước nào giúp giảm nguy cơ khách hàng phải gọi lại nhiều lần?"] = true
            },
            startedAt: now.AddDays(-4).AddHours(-1),
            submittedAt: now.AddDays(-4),
            durationMinutes: 16);

        await context.SaveChangesAsync();
    }

    private static async Task SeedAuditLogsAsync(LmsDbContext context, int adminId, IClock clock, IReadOnlyList<User> students)
    {
        var now = clock.UtcNow;
        var courseAgile = await context.Courses.FirstOrDefaultAsync(x => x.Code == "LMS-AGILE-01" && !x.IsDelete);
        var examAgile = await context.Exams.FirstOrDefaultAsync(x => x.Code == "EX-AGILE-01" && !x.IsDelete);
        var huyen = students.First(x => x.UserName == "huyen.nguyen");
        var result = examAgile == null
            ? null
            : await context.ExamResults.FirstOrDefaultAsync(x => x.ExamId == examAgile.Id && x.UserId == huyen.Id && !x.IsDelete);
        var certificate = examAgile == null
            ? null
            : await context.Certificates.FirstOrDefaultAsync(x => x.ExamId == examAgile.Id && x.UserId == huyen.Id && !x.IsDelete);

        if (courseAgile != null)
        {
            await EnsureAuditLogAsync(context, adminId, "CREATE", "Course", courseAgile.Id, null,
                "{\"Code\":\"LMS-AGILE-01\",\"Name\":\"Nhập môn Quản trị dự án Agile\"}", now.AddDays(-16));
        }

        if (examAgile != null)
        {
            await EnsureAuditLogAsync(context, adminId, "ASSIGN", "Exam", examAgile.Id, null,
                $"{{\"UserId\":{huyen.Id},\"ExamCode\":\"EX-AGILE-01\"}}", now.AddDays(-15));
        }

        if (result != null)
        {
            await EnsureAuditLogAsync(context, huyen.Id, "SUBMIT_EXAM", "ExamAttempt", result.AttemptId, null,
                $"{{\"ExamId\":{result.ExamId},\"Score\":{result.Score},\"Passed\":{result.Passed.ToString().ToLowerInvariant()}}}", result.CompletedDate);
        }

        if (certificate != null)
        {
            await EnsureAuditLogAsync(context, adminId, "GENERATE_CERTIFICATE", "Certificate", certificate.Id, null,
                $"{{\"CertificateCode\":\"{certificate.CertificateCode}\",\"UserId\":{huyen.Id}}}", certificate.IssuedDate);
        }

        await context.SaveChangesAsync();
    }

    private static async Task<Group> EnsureGroupAsync(LmsDbContext context, int adminId, DateTime now, string name, string description)
    {
        var groupKey = DemoKey(name);
        var existing = (await context.Groups.Where(x => !x.IsDelete).ToListAsync())
            .FirstOrDefault(x => DemoKey(x.Name) == groupKey);
        if (existing != null)
        {
            existing.Name = name;
            existing.Description = description;
            existing.UpdatedBy = adminId;
            existing.UpdateDate = now;
            await context.SaveChangesAsync();
            return existing;
        }

        var entity = new Group
        {
            Name = name,
            Description = description,
            CreatedBy = adminId,
            CreatedDate = now,
            IsDelete = false
        };

        context.Groups.Add(entity);
        await context.SaveChangesAsync();
        return entity;
    }

    private static async Task EnsureGroupUserAsync(LmsDbContext context, int groupId, int userId)
    {
        var exists = await context.GroupUsers.AnyAsync(x => x.GroupId == groupId && x.UserId == userId);
        if (!exists)
        {
            context.GroupUsers.Add(new GroupUser { GroupId = groupId, UserId = userId });
        }
    }

    private static async Task EnsureAuditLogAsync(
        LmsDbContext context,
        int? userId,
        string action,
        string entityName,
        int? entityId,
        string? beforeData,
        string? afterData,
        DateTime createdDate)
    {
        var exists = await context.AuditLogs.AnyAsync(x =>
            x.UserId == userId &&
            x.Action == action &&
            x.EntityName == entityName &&
            x.EntityId == entityId);

        if (exists)
        {
            return;
        }

        context.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            BeforeData = beforeData,
            AfterData = afterData,
            CreatedDate = createdDate,
            CreatedBy = userId,
            IsDelete = false
        });
    }

    private static async Task<Course> EnsureCourseAsync(
        LmsDbContext context, int adminId, DateTime now,
        string code, string name, string description, bool isPublished)
    {
        var existing = await context.Courses.FirstOrDefaultAsync(x => x.Code == code && !x.IsDelete);
        if (existing != null)
        {
            existing.Name = name;
            existing.Description = description;
            existing.IsPublished = isPublished;
            existing.UpdatedBy = adminId;
            existing.UpdateDate = now;
            await context.SaveChangesAsync();
            return existing;
        }

        var entity = new Course
        {
            Code = code,
            Name = name,
            Description = description,
            IsPublished = isPublished,
            CreatedBy = adminId,
            CreatedDate = now,
            IsDelete = false
        };

        context.Courses.Add(entity);
        await context.SaveChangesAsync();
        return entity;
    }

    private static async Task<LearningMaterial> EnsureMaterialAsync(
        LmsDbContext context, int adminId, DateTime now, int courseId,
        string title, string contentType, int order, string? textContent, string? externalLink, int? durationMinutes = null)
    {
        var titleKey = DemoKey(title);
        var existing = (await context.LearningMaterials
                .Where(x => x.CourseId == courseId && !x.IsDelete)
                .ToListAsync())
            .FirstOrDefault(x => DemoKey(x.Title) == titleKey);
        if (existing != null)
        {
            existing.Title = title;
            existing.ContentType = contentType;
            existing.TextContent = textContent;
            existing.ExternalLink = externalLink;
            existing.DurationMinutes = durationMinutes;
            existing.Order = order;
            existing.UpdatedBy = adminId;
            existing.UpdateDate = now;
            await context.SaveChangesAsync();
            return existing;
        }

        var entity = new LearningMaterial
        {
            CourseId = courseId,
            Title = title,
            ContentType = contentType,
            TextContent = textContent,
            ExternalLink = externalLink,
            DurationMinutes = durationMinutes,
            Order = order,
            CreatedBy = adminId,
            CreatedDate = now,
            IsDelete = false
        };

        context.LearningMaterials.Add(entity);
        await context.SaveChangesAsync();
        return entity;
    }

    private static async Task<QuestionCategory> EnsureCategoryAsync(
        LmsDbContext context, int adminId, DateTime now,
        string name, string description)
    {
        var categoryKey = DemoKey(name);
        var existing = (await context.QuestionCategories.Where(x => !x.IsDelete).ToListAsync())
            .FirstOrDefault(x => DemoKey(x.Name) == categoryKey);
        if (existing != null)
        {
            existing.Name = name;
            existing.Description = description;
            existing.UpdatedBy = adminId;
            existing.UpdateDate = now;
            await context.SaveChangesAsync();
            return existing;
        }

        var entity = new QuestionCategory
        {
            Name = name,
            Description = description,
            CreatedBy = adminId,
            CreatedDate = now,
            IsDelete = false
        };

        context.QuestionCategories.Add(entity);
        await context.SaveChangesAsync();
        return entity;
    }

    private static async Task<Question> EnsureQuestionAsync(
        LmsDbContext context, int adminId, DateTime now, int categoryId,
        string content, string questionType, string difficulty, int order, decimal score,
        IReadOnlyList<(string Content, bool IsCorrect)> options)
    {
        var questionKey = DemoKey(content);
        var existing = (await context.Questions.Where(x => !x.IsDelete).ToListAsync())
            .FirstOrDefault(x => DemoKey(x.Content) == questionKey);
        if (existing != null)
        {
            existing.CategoryId = categoryId;
            existing.Content = content;
            existing.QuestionType = questionType;
            existing.Difficulty = difficulty;
            existing.Order = order;
            existing.Score = score;
            existing.UpdatedBy = adminId;
            existing.UpdateDate = now;
            await context.SaveChangesAsync();
            await EnsureAnswerOptionsAsync(context, adminId, now, existing.Id, options);
            return existing;
        }

        var entity = new Question
        {
            CategoryId = categoryId,
            Content = content,
            QuestionType = questionType,
            Difficulty = difficulty,
            Order = order,
            Score = score,
            CreatedBy = adminId,
            CreatedDate = now,
            IsDelete = false
        };

        context.Questions.Add(entity);
        await context.SaveChangesAsync();
        await EnsureAnswerOptionsAsync(context, adminId, now, entity.Id, options);
        return entity;
    }

    private static async Task EnsureAnswerOptionsAsync(
        LmsDbContext context, int adminId, DateTime now, int questionId, IReadOnlyList<(string Content, bool IsCorrect)> options)
    {
        var existing = await context.AnswerOptions.Where(x => x.QuestionId == questionId && !x.IsDelete).ToListAsync();

        for (var i = 0; i < options.Count; i++)
        {
            var option = options[i];
            var optionKey = DemoKey(option.Content);
            var found = existing.FirstOrDefault(x => DemoKey(x.Content) == optionKey);
            if (found != null)
            {
                found.Content = option.Content;
                found.IsCorrect = option.IsCorrect;
                found.Order = i + 1;
                found.UpdatedBy = adminId;
                found.UpdateDate = now;
                continue;
            }

            context.AnswerOptions.Add(new AnswerOption
            {
                QuestionId = questionId,
                Content = option.Content,
                IsCorrect = option.IsCorrect,
                Order = i + 1,
                CreatedBy = adminId,
                CreatedDate = now,
                IsDelete = false
            });
        }

        await context.SaveChangesAsync();
    }

    private static async Task<Exam> EnsureExamAsync(
        LmsDbContext context, int adminId, DateTime now,
        string code, string name, string description, int durationMinutes,
        decimal passScore, string reviewMode, bool isPublished)
    {
        var existing = await context.Exams.FirstOrDefaultAsync(x => x.Code == code && !x.IsDelete);
        if (existing != null)
        {
            existing.Name = name;
            existing.Description = description;
            existing.DurationMinutes = durationMinutes;
            existing.PassScore = passScore;
            existing.ReviewMode = reviewMode;
            existing.ShowCorrectAnswers = reviewMode is "FullReview" or "AnswerOnly";
            existing.ShowSelectedAnswers = reviewMode != "ResultOnly";
            existing.ShowQuestionReview = reviewMode != "NoReview";
            existing.IsPublished = isPublished;
            existing.UpdatedBy = adminId;
            existing.UpdateDate = now;
            await context.SaveChangesAsync();
            return existing;
        }

        var entity = new Exam
        {
            Code = code,
            Name = name,
            Description = description,
            DurationMinutes = durationMinutes,
            PassScore = passScore,
            AttemptLimit = 3,
            RandomQuestion = false,
            RandomAnswer = false,
            ReviewMode = reviewMode,
            ShowCorrectAnswers = reviewMode is "FullReview" or "AnswerOnly",
            ShowSelectedAnswers = reviewMode != "ResultOnly",
            ShowQuestionReview = reviewMode != "NoReview",
            IsPublished = isPublished,
            CreatedBy = adminId,
            CreatedDate = now,
            IsDelete = false
        };

        context.Exams.Add(entity);
        await context.SaveChangesAsync();
        return entity;
    }

    private static async Task EnsureCourseExamAsync(LmsDbContext context, int courseId, int examId, int order)
    {
        var exists = await context.CourseExams.AnyAsync(x => x.CourseId == courseId && x.ExamId == examId);
        if (!exists)
        {
            context.CourseExams.Add(new CourseExam { CourseId = courseId, ExamId = examId, Order = order });
        }
    }

    private static async Task EnsureExamQuestionAsync(LmsDbContext context, int examId, int questionId, decimal score, int order)
    {
        var exists = await context.ExamQuestions.AnyAsync(x => x.ExamId == examId && x.QuestionId == questionId);
        if (!exists)
        {
            context.ExamQuestions.Add(new ExamQuestion
            {
                ExamId = examId,
                QuestionId = questionId,
                Score = score,
                Order = order
            });
        }
    }

    private static async Task EnsureCourseAssignmentAsync(LmsDbContext context, int courseId, int userId)
    {
        var exists = await context.CourseAssignments.AnyAsync(x => x.CourseId == courseId && x.UserId == userId);
        if (!exists)
        {
            context.CourseAssignments.Add(new CourseAssignment { CourseId = courseId, UserId = userId });
        }
    }

    private static async Task EnsureGroupCourseAssignmentAsync(LmsDbContext context, int groupId, int courseId)
    {
        var exists = await context.GroupCourseAssignments.AnyAsync(x => x.GroupId == groupId && x.CourseId == courseId);
        if (!exists)
        {
            context.GroupCourseAssignments.Add(new GroupCourseAssignment { GroupId = groupId, CourseId = courseId });
        }
    }

    private static async Task EnsureExamAssignmentAsync(LmsDbContext context, int examId, int userId, DateTime startDate, DateTime endDate)
    {
        var exists = await context.ExamAssignments.AnyAsync(x => x.ExamId == examId && x.UserId == userId);
        if (!exists)
        {
            context.ExamAssignments.Add(new ExamAssignment
            {
                ExamId = examId,
                UserId = userId,
                StartDate = startDate,
                EndDate = endDate
            });
        }
    }

    private static async Task EnsureGroupExamAssignmentAsync(LmsDbContext context, int examId, int groupId, DateTime startDate, DateTime endDate)
    {
        var exists = await context.GroupExamAssignments.AnyAsync(x => x.ExamId == examId && x.GroupId == groupId);
        if (!exists)
        {
            context.GroupExamAssignments.Add(new GroupExamAssignment
            {
                ExamId = examId,
                GroupId = groupId,
                StartDate = startDate,
                EndDate = endDate
            });
        }
    }

    private static async Task EnsureLearningProgressAsync(
        LmsDbContext context, int adminId, DateTime now,
        int userId, int courseId, int materialId, decimal progressPercent, bool isCompleted, DateTime? completedDate)
    {
        var existing = await context.LearningProgress
            .FirstOrDefaultAsync(x => x.UserId == userId && x.LearningMaterialId == materialId && !x.IsDelete);

        if (existing != null)
        {
            existing.CourseId = courseId;
            existing.ProgressPercent = progressPercent;
            existing.IsCompleted = isCompleted;
            existing.CompletedDate = completedDate;
            existing.UpdatedBy = adminId;
            existing.UpdateDate = now;
            await context.SaveChangesAsync();
            return;
        }

        context.LearningProgress.Add(new LearningProgress
        {
            UserId = userId,
            CourseId = courseId,
            LearningMaterialId = materialId,
            ProgressPercent = progressPercent,
            IsCompleted = isCompleted,
            CompletedDate = completedDate,
            CreatedBy = adminId,
            CreatedDate = now,
            IsDelete = false
        });
    }

    private static async Task EnsureCompletedAttemptAsync(
        LmsDbContext context,
        int adminId,
        DateTime now,
        IFileStorageService fileStorage,
        User student,
        Exam exam,
        IReadOnlyList<ExamQuestion> examQuestions,
        IReadOnlyList<Question> questions,
        IReadOnlyList<AnswerOption> answerOptions,
        IReadOnlyDictionary<string, bool> answerPlan,
        DateTime startedAt,
        DateTime submittedAt,
        int durationMinutes)
    {
        var existingResult = await context.ExamResults
            .FirstOrDefaultAsync(x => x.UserId == student.Id && x.ExamId == exam.Id && !x.IsDelete);
        if (existingResult != null)
        {
            await EnsureCertificateForResultAsync(context, adminId, now, fileStorage, student, exam, existingResult);
            return;
        }

        var attempt = new ExamAttempt
        {
            ExamId = exam.Id,
            UserId = student.Id,
            StartedAt = startedAt,
            SubmittedAt = submittedAt,
            DurationMinutes = durationMinutes,
            Status = "Submitted",
            CreatedBy = adminId,
            CreatedDate = startedAt,
            IsDelete = false
        };

        context.ExamAttempts.Add(attempt);
        await context.SaveChangesAsync();

        decimal totalScore = 0m;
        decimal earnedScore = 0m;

        foreach (var examQuestion in examQuestions.OrderBy(x => x.Order))
        {
            var question = questions.First(x => x.Id == examQuestion.QuestionId);
            var options = answerOptions.Where(x => x.QuestionId == question.Id && !x.IsDelete).OrderBy(x => x.Order).ToList();
            var shouldBeCorrect = answerPlan.TryGetValue(question.Content, out var isCorrectPlan) && isCorrectPlan;
            var selectedOptionIds = shouldBeCorrect
                ? options.Where(x => x.IsCorrect).Select(x => x.Id).ToHashSet()
                : options.Where(x => !x.IsCorrect).Take(1).Select(x => x.Id).ToHashSet();

            totalScore += examQuestion.Score;

            context.AttemptQuestionSnapshots.Add(new AttemptQuestionSnapshot
            {
                AttemptId = attempt.Id,
                QuestionId = question.Id,
                Content = question.Content,
                QuestionType = question.QuestionType,
                Score = examQuestion.Score,
                Order = examQuestion.Order
            });

            foreach (var option in options)
            {
                context.AttemptAnswerSnapshots.Add(new AttemptAnswerSnapshot
                {
                    AttemptId = attempt.Id,
                    QuestionId = question.Id,
                    AnswerOptionId = option.Id,
                    Content = option.Content,
                    IsCorrect = option.IsCorrect,
                    Order = option.Order
                });

                if (selectedOptionIds.Contains(option.Id))
                {
                    context.AttemptAnswers.Add(new AttemptAnswer
                    {
                        AttemptId = attempt.Id,
                        QuestionId = question.Id,
                        AnswerOptionId = option.Id
                    });
                }
            }

            if (shouldBeCorrect)
            {
                earnedScore += examQuestion.Score;
            }
        }

        var finalScore = totalScore <= 0 ? 0 : Math.Round((earnedScore / totalScore) * 100m, 2);
        var passed = finalScore >= exam.PassScore;

        attempt.Score = finalScore;
        attempt.Passed = passed;

        await context.SaveChangesAsync();

        var result = new ExamResult
        {
            AttemptId = attempt.Id,
            ExamId = exam.Id,
            UserId = student.Id,
            Score = finalScore,
            Passed = passed,
            CompletedDate = submittedAt,
            CreatedBy = adminId,
            CreatedDate = submittedAt,
            IsDelete = false
        };

        context.ExamResults.Add(result);
        await context.SaveChangesAsync();

        foreach (var examQuestion in examQuestions.OrderBy(x => x.Order))
        {
            var question = questions.First(x => x.Id == examQuestion.QuestionId);
            var isCorrect = answerPlan.TryGetValue(question.Content, out var isCorrectPlan) && isCorrectPlan;

            context.ExamResultDetails.Add(new ExamResultDetail
            {
                ExamResultId = result.Id,
                QuestionId = question.Id,
                IsCorrect = isCorrect,
                ScoreEarned = isCorrect ? examQuestion.Score : 0m
            });
        }

        context.AttemptEvents.Add(new AttemptEvent
        {
            AttemptId = attempt.Id,
            EventType = "SUBMIT",
            EventData = $"{{\"score\":{finalScore},\"passed\":{passed.ToString().ToLowerInvariant()}}}",
            CreatedDate = submittedAt
        });

        await context.SaveChangesAsync();
        await EnsureCertificateForResultAsync(context, adminId, now, fileStorage, student, exam, result);
    }

    private static async Task EnsureCertificateForResultAsync(
        LmsDbContext context,
        int adminId,
        DateTime now,
        IFileStorageService fileStorage,
        User student,
        Exam exam,
        ExamResult result)
    {
        if (!result.Passed)
        {
            return;
        }

        var existing = await context.Certificates
            .FirstOrDefaultAsync(x => x.UserId == student.Id && x.ExamId == exam.Id && !x.IsDelete);
        if (existing != null)
        {
            return;
        }

        var certificate = new Certificate
        {
            UserId = student.Id,
            ExamId = exam.Id,
            CertificateCode = $"CERT-{result.CompletedDate:yyyyMMdd}-{student.Id}-{exam.Id}".Substring(0, Math.Min(32, $"CERT-{result.CompletedDate:yyyyMMdd}-{student.Id}-{exam.Id}".Length)),
            IssuedDate = result.CompletedDate,
            CreatedBy = adminId,
            CreatedDate = now,
            IsDelete = false
        };

        context.Certificates.Add(certificate);
        await context.SaveChangesAsync();

        var html = $"""
<!doctype html>
<html lang="vi">
<head><meta charset="utf-8"><title>{certificate.CertificateCode}</title></head>
<body>
<h1>Chứng nhận hoàn thành</h1>
<p>Học viên: {student.FullName}</p>
<p>Bài thi: {exam.Name}</p>
<p>Điểm đạt được: {result.Score}</p>
<p>Ngày cấp: {certificate.IssuedDate:dd/MM/yyyy}</p>
</body>
</html>
""";

        var bytes = Encoding.UTF8.GetBytes(html);
        await using var stream = new MemoryStream(bytes);
        var storedName = await fileStorage.SaveFileAsync(stream, certificate.CertificateCode + ".html");

        context.CertificateFiles.Add(new CertificateFile
        {
            CertificateId = certificate.Id,
            OriginalFileName = certificate.CertificateCode + ".html",
            StoredFileName = storedName,
            FileSize = bytes.Length,
            StoragePath = storedName
        });

        await context.SaveChangesAsync();
    }
}
