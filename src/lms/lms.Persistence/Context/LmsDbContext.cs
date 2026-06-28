using Microsoft.EntityFrameworkCore;
using lms.Domain.Common;
using lms.Domain.Entities;

namespace lms.Persistence.Context;

public class LmsDbContext : DbContext
{
    public LmsDbContext(DbContextOptions<LmsDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupUser> GroupUsers => Set<GroupUser>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<CourseAssignment> CourseAssignments => Set<CourseAssignment>();
    public DbSet<GroupCourseAssignment> GroupCourseAssignments => Set<GroupCourseAssignment>();
    public DbSet<LearningMaterial> LearningMaterials => Set<LearningMaterial>();
    public DbSet<LearningMaterialFile> LearningMaterialFiles => Set<LearningMaterialFile>();
    public DbSet<LearningProgress> LearningProgress => Set<LearningProgress>();
    public DbSet<QuestionCategory> QuestionCategories => Set<QuestionCategory>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<AnswerOption> AnswerOptions => Set<AnswerOption>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<ExamQuestion> ExamQuestions => Set<ExamQuestion>();
    public DbSet<ExamRandomRule> ExamRandomRules => Set<ExamRandomRule>();
    public DbSet<ExamAssignment> ExamAssignments => Set<ExamAssignment>();
    public DbSet<GroupExamAssignment> GroupExamAssignments => Set<GroupExamAssignment>();
    public DbSet<CourseExam> CourseExams => Set<CourseExam>();
    public DbSet<ExamAttempt> ExamAttempts => Set<ExamAttempt>();
    public DbSet<AttemptQuestionSnapshot> AttemptQuestionSnapshots => Set<AttemptQuestionSnapshot>();
    public DbSet<AttemptAnswerSnapshot> AttemptAnswerSnapshots => Set<AttemptAnswerSnapshot>();
    public DbSet<AttemptAnswer> AttemptAnswers => Set<AttemptAnswer>();
    public DbSet<AttemptEvent> AttemptEvents => Set<AttemptEvent>();
    public DbSet<ExamResult> ExamResults => Set<ExamResult>();
    public DbSet<ExamResultDetail> ExamResultDetails => Set<ExamResultDetail>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<CertificateFile> CertificateFiles => Set<CertificateFile>();
    public DbSet<FileRecord> FileRecords => Set<FileRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(LmsDbContext).Assembly);

        // Convention chung: mọi entity kế thừa AuditableEntity có cột IsDelete default 0.
        // Giải quyết gap "IsDelete nên có default constraint 0" trong doc/17_BACKEND_MODULE_DESIGN/README.md.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(AuditableEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .Property(nameof(AuditableEntity.IsDelete))
                    .HasDefaultValue(false);
            }
        }
    }
}
