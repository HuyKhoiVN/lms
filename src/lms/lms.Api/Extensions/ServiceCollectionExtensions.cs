using System;
using System.Reflection;
using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using lms.Api.Configuration;
using lms.Api.Filters;
using lms.Application.Common.Audit;
using lms.Application.Common.Time;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Application.Services;
using lms.Infrastructure.Services;
using lms.Persistence.Context;
using lms.Persistence.Repositories;

namespace lms.Api.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Đăng ký <see cref="LmsDbContext"/> với SQL Server và toàn bộ repository.
    /// </summary>
    public static IServiceCollection AddLmsPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<LmsDbContext>(options =>
        {
            options.UseSqlServer(configuration.GetConnectionString("LmsDb"));
        });

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IUserRoleRepository, UserRoleRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IGroupRepository, GroupRepository>();
        services.AddScoped<IGroupUserRepository, GroupUserRepository>();
        services.AddScoped<ICourseRepository, CourseRepository>();
        services.AddScoped<ICourseAssignmentRepository, CourseAssignmentRepository>();
        services.AddScoped<IGroupCourseAssignmentRepository, GroupCourseAssignmentRepository>();
        services.AddScoped<ICourseExamRepository, CourseExamRepository>();
        // Repository Phase 3
        services.AddScoped<ILearningMaterialRepository, LearningMaterialRepository>();
        services.AddScoped<ILearningMaterialFileRepository, LearningMaterialFileRepository>();
        services.AddScoped<ILearningProgressRepository, LearningProgressRepository>();

        // Repository Phase 4 – Question Bank
        services.AddScoped<IQuestionCategoryRepository, QuestionCategoryRepository>();
        services.AddScoped<IQuestionRepository, QuestionRepository>();
        services.AddScoped<IAnswerOptionRepository, AnswerOptionRepository>();

        // Repository Phase 5 – Exam Management & Assignment
        services.AddScoped<IExamRepository, ExamRepository>();
        services.AddScoped<IExamQuestionRepository, ExamQuestionRepository>();
        services.AddScoped<IExamRandomRuleRepository, ExamRandomRuleRepository>();
        services.AddScoped<IExamAssignmentRepository, ExamAssignmentRepository>();
        services.AddScoped<IGroupExamAssignmentRepository, GroupExamAssignmentRepository>();

        // Repository Phase 6 – Exam Engine (attempts + snapshots)
        services.AddScoped<IExamAttemptRepository, ExamAttemptRepository>();
        services.AddScoped<IAttemptQuestionSnapshotRepository, AttemptQuestionSnapshotRepository>();
        services.AddScoped<IAttemptAnswerSnapshotRepository, AttemptAnswerSnapshotRepository>();
        services.AddScoped<IAttemptAnswerRepository, AttemptAnswerRepository>();
        services.AddScoped<IAttemptEventRepository, AttemptEventRepository>();

        // Repository Phase 7 – Result
        services.AddScoped<IExamResultRepository, ExamResultRepository>();
        services.AddScoped<IExamResultDetailRepository, ExamResultDetailRepository>();

        // Repository Phase 8 - Certificate & Reporting
        services.AddScoped<ICertificateRepository, CertificateRepository>();
        services.AddScoped<IReportReadRepository, ReportReadRepository>();
        services.AddScoped<IFileRecordRepository, FileRecordRepository>();
        services.AddScoped<ICertificateFileRepository, CertificateFileRepository>();

        return services;
    }

    /// <summary>
    /// Đăng ký Application services + FluentValidation.
    /// </summary>
    public static IServiceCollection AddLmsApplication(this IServiceCollection services)
    {
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IUserRoleService, UserRoleService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IGroupService, GroupService>();
        services.AddScoped<IGroupMemberService, GroupMemberService>();
        services.AddScoped<ICourseService, CourseService>();
        services.AddScoped<ICourseAssignmentService, CourseAssignmentService>();
        services.AddScoped<ICourseAccessService, CourseAccessService>();
        services.AddScoped<IFileRecordService, FileRecordService>();
        services.AddScoped<IFileAccessService, FileAccessService>();

        // Learning Material & Progress (Phase 3)
        services.AddScoped<ILearningMaterialService, LearningMaterialService>();
        services.AddScoped<IMaterialAccessService, MaterialAccessService>();
        services.AddScoped<ILearningProgressService, LearningProgressService>();

        // Question Bank (Phase 4)
        services.AddScoped<IQuestionCategoryService, QuestionCategoryService>();
        services.AddScoped<IQuestionService, QuestionService>();

        // Exam Management & Assignment (Phase 5)
        services.AddScoped<IExamService, ExamService>();
        services.AddScoped<IExamAssignmentService, ExamAssignmentService>();
        services.AddScoped<IExamAccessService, ExamAccessService>();

        // Exam Engine (Phase 6)
        services.AddScoped<IExamAttemptService, ExamAttemptService>();

        // Scoring & Result (Phase 7)
        services.AddScoped<IResultService, ResultService>();

        // Certificate & Reporting (Phase 8)
        services.AddScoped<ICertificateService, CertificateService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IReportExportService, ReportExportService>();

        // Audit query (read-side)
        services.AddScoped<IAuditQueryService, AuditQueryService>();

        // FluentValidation: scan assembly Application để tự đăng ký validator các phase sau.
        services.AddValidatorsFromAssembly(
            typeof(lms.Application.DTOs.Common.ApiResponse<>).Assembly,
            includeInternalTypes: true);

        return services;
    }

    /// <summary>
    /// Đăng ký Infrastructure services (clock, audit dispatcher, password, token, file storage, current user).
    /// </summary>
    public static IServiceCollection AddLmsInfrastructure(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();

        services.AddSingleton<IClock, SystemClock>();

        services.AddScoped<IPasswordHasherService, PasswordHasherService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IFileStorageService, FileStorageService>();
        services.AddScoped<IAuditDispatcher, AuditDispatcher>();

        return services;
    }

    /// <summary>
    /// Đăng ký JWT Bearer với <see cref="JwtOptions"/>.
    /// </summary>
    public static IServiceCollection AddLmsAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        services.Configure<JwtOptions>(jwtSection);

        var options = jwtSection.Get<JwtOptions>() ?? new JwtOptions();
        if (string.IsNullOrWhiteSpace(options.Secret))
        {
            throw new InvalidOperationException(
                "Missing required configuration 'Jwt:Secret'. Set it via appsettings or user secrets.");
        }

        services
            .AddAuthentication(authOptions =>
            {
                authOptions.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                authOptions.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(jwtOptions =>
            {
                jwtOptions.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = options.Issuer,
                    ValidAudience = options.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Secret)),
                    ClockSkew = TimeSpan.Zero
                };
            });

        services.AddAuthorization();

        return services;
    }

    /// <summary>
    /// Đăng ký Controllers + tắt ModelState filter mặc định + bật ValidationActionFilter.
    /// </summary>
    public static IServiceCollection AddLmsControllers(this IServiceCollection services)
    {
        services.AddControllers(options =>
        {
            options.Filters.Add<ValidationActionFilter>();
        });

        // Tắt 400 ProblemDetails mặc định để middleware envelope tự xử lý.
        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.SuppressModelStateInvalidFilter = true;
        });

        return services;
    }

    /// <summary>
    /// Đăng ký Swagger + Authorize button cho JWT.
    /// </summary>
    public static IServiceCollection AddLmsSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "LMS Backend API",
                Version = "v1",
                Description = "API tài liệu cho hệ thống quản lý học tập (LMS).",
                Contact = new OpenApiContact { Name = "LMS Team" }
            });

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Description = "Nhập JWT theo định dạng: Bearer {token}",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });

            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = System.IO.Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (System.IO.File.Exists(xmlPath))
            {
                options.IncludeXmlComments(xmlPath);
            }
        });

        return services;
    }
}
