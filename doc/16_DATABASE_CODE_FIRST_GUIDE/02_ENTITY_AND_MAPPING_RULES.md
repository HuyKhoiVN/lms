# Entity And EF Core Mapping Rules

## 1. Purpose

This document defines how to design entities, `DbContext`, and EF Core configurations for the `lms` Code First database.

The most important rule is:

```txt
Use scalar logical reference Ids.
Do not configure EF relationships that generate database foreign key constraints.
```

## 2. Project Location Rules

### Domain

Entities must be placed in:

```txt
src/lms/lms.Domain/Entities
```

Common base classes:

```txt
src/lms/lms.Domain/Common
```

Enums:

```txt
src/lms/lms.Domain/Enums
```

### Persistence

DbContext:

```txt
src/lms/lms.Persistence/Context/LmsDbContext.cs
```

Entity configurations:

```txt
src/lms/lms.Persistence/Configurations
```

Migrations:

```txt
src/lms/lms.Persistence/Migrations
```

## 3. Base Entity Rules

Recommended base entity:

```csharp
public abstract class BaseEntity
{
    public int Id { get; set; }
}
```

Recommended auditable entity:

```csharp
public abstract class AuditableEntity : BaseEntity
{
    public DateTime? CreatedDate { get; set; }
    public DateTime? UpdateDate { get; set; }
    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
    public bool IsDelete { get; set; }
}
```

Use `IsDelete`, not `IsDeleted`.

## 4. Entity Naming Rules

Entity names use singular PascalCase:

```txt
User
Role
Course
LearningMaterial
Question
AnswerOption
Exam
ExamAttempt
ExamResult
Certificate
AuditLog
```

Table names use plural PascalCase:

```txt
Users
Roles
Courses
LearningMaterials
Questions
AnswerOptions
Exams
ExamAttempts
ExamResults
Certificates
AuditLogs
```

Column names use PascalCase:

```txt
Id
UserName
FullName
CourseId
ExamId
QuestionId
CreatedDate
UpdateDate
IsDelete
```

## 5. Logical Reference Rules

Use scalar Id properties for relationships:

```csharp
public class ExamAttempt : AuditableEntity
{
    public int ExamId { get; set; }
    public int UserId { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
}
```

Do not add navigation properties:

```csharp
// Do not do this.
public Exam Exam { get; set; }
public User User { get; set; }
```

Do not add collection navigation properties:

```csharp
// Do not do this.
public ICollection<ExamAttempt> ExamAttempts { get; set; }
public ICollection<AnswerOption> Answers { get; set; }
```

## 6. DbContext Rules

`LmsDbContext` should expose `DbSet` properties for aggregate/entity tables:

```csharp
public DbSet<User> Users => Set<User>();
public DbSet<Course> Courses => Set<Course>();
public DbSet<Question> Questions => Set<Question>();
public DbSet<Exam> Exams => Set<Exam>();
public DbSet<ExamAttempt> ExamAttempts => Set<ExamAttempt>();
```

`OnModelCreating` should only apply configurations:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(LmsDbContext).Assembly);
}
```

Do not place long entity mapping directly inside `LmsDbContext`.

## 7. Configuration Rules

Each entity should have a separate configuration file:

```txt
UserConfiguration.cs
CourseConfiguration.cs
QuestionConfiguration.cs
ExamConfiguration.cs
ExamAttemptConfiguration.cs
```

Example:

```csharp
public sealed class ExamAttemptConfiguration : IEntityTypeConfiguration<ExamAttempt>
{
    public void Configure(EntityTypeBuilder<ExamAttempt> builder)
    {
        builder.ToTable("ExamAttempts");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ExamId).IsRequired();
        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(50);
        builder.Property(x => x.Score).HasColumnType("decimal(18,2)");

        builder.HasIndex(x => x.ExamId);
        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.Status);
    }
}
```

The indexes above are normal indexes only. They are allowed because they do not enforce relationships.

## 8. Forbidden EF Core Mapping

Do not use:

```csharp
builder.HasOne(...);
builder.HasMany(...);
builder.WithOne(...);
builder.WithMany(...);
builder.HasForeignKey(...);
builder.OnDelete(...);
```

These APIs usually create relationship metadata and can generate foreign key constraints in migration.

## 9. Delete Behavior

Do not rely on database cascade delete.

Use soft delete for master data:

```txt
IsDelete = true
UpdateDate = current time
UpdatedBy = current user id
```

Soft delete applies to:

- `Users`
- `Groups`
- `Courses`
- `LearningMaterials`
- `QuestionCategories`
- `Questions`
- `AnswerOptions`
- `Exams`

Transaction and history tables should normally not be deleted:

- `ExamAttempts`
- `AttemptQuestionSnapshots`
- `AttemptAnswerSnapshots`
- `AttemptAnswers`
- `ExamResults`
- `Certificates`
- `AuditLogs`

## 10. Enum Storage

Use one of these patterns consistently per entity:

### Recommended For Readability

Store enum as string:

```csharp
builder.Property(x => x.Status).HasMaxLength(50);
builder.Property(x => x.ReviewMode).HasMaxLength(50);
```

Examples:

```txt
Published
Draft
FULL_REVIEW
RESULT_ONLY
```

### Alternative For Compact Storage

Store enum as int only when the enum is stable and not shown directly in reports.

For this LMS project, string status fields are easier to inspect and align well with current UI mock data.

## 11. Decimal Rules

Scores and rates should use decimal:

```csharp
builder.Property(x => x.PassScore).HasColumnType("decimal(18,2)");
builder.Property(x => x.Score).HasColumnType("decimal(18,2)");
```

Avoid floating point types for scores:

```txt
float
double
```

## 12. Text And File Rules

Short text:

```txt
NVARCHAR(50)
NVARCHAR(100)
NVARCHAR(255)
```

Long content:

```txt
NVARCHAR(MAX)
```

Use `NVARCHAR(MAX)` for:

- Question content
- Material text content
- Audit before/after JSON
- Long descriptions

File metadata should store:

- Original file name
- Stored file name or key
- Content type
- File size
- Storage provider
- Relative path or object key

Do not store large binary files directly in core business tables.

## 13. Index Rules

Indexes are allowed and recommended for logical reference columns.

Common index targets:

- `UserId`
- `RoleId`
- `GroupId`
- `CourseId`
- `MaterialId`
- `QuestionId`
- `ExamId`
- `AttemptId`
- `Status`
- `CreatedDate`
- `SubmittedAt`

Composite indexes can be added for common uniqueness/query rules.

Examples:

```txt
Users.UserName
Users.Email
UserRoles.UserId + UserRoles.RoleId
GroupUsers.GroupId + GroupUsers.UserId
CourseAssignments.CourseId + CourseAssignments.UserId
ExamAssignments.ExamId + ExamAssignments.UserId
LearningProgress.UserId + LearningProgress.MaterialId
```

These indexes must not be foreign keys.

## 14. Uniqueness Rules

Use unique indexes for natural unique values when needed:

- `Users.UserName`
- `Users.Email`, if email is required to be unique
- `Roles.Name`
- `Certificates.CertificateCode`
- `RefreshTokens.Token`

Before adding a unique index, confirm how soft-delete records should behave. If soft-deleted records should not block reuse, use a filtered unique index where possible.

## 15. Application Validation Required

Because the database has no FK constraints, services must validate relationships.

Examples:

```txt
CreateGroupUser:
  - Check Group exists and IsDelete = false
  - Check User exists and IsDelete = false
  - Check duplicate GroupId + UserId does not exist

StartExamAttempt:
  - Check Exam exists
  - Check Exam is published
  - Check User has assignment or access
  - Check attempt limit

SaveAttemptAnswer:
  - Check Attempt exists
  - Check Attempt belongs to current User
  - Check Attempt is not submitted
  - Check SnapshotQuestionId belongs to Attempt
```

## 16. Exam Snapshot Rules

At exam start:

1. Create `ExamAttempt`.
2. Select questions.
3. Copy question data into `AttemptQuestionSnapshots`.
4. Copy answer data into `AttemptAnswerSnapshots`.
5. Return only safe snapshot data to UI.

Do not expose correct answers before submit.

Scoring must use snapshot data, not live question bank data.

## 17. Audit Rules

Audit required for:

- Login
- Logout
- Create
- Update
- Delete
- Assign
- Submit exam
- Generate certificate
- Export report

`AuditLogs` is append-only:

- No update
- No delete
- No soft delete from normal workflows

## 18. Migration Review Rules

Every migration must be reviewed before applying.

The migration must not contain:

```csharp
table.ForeignKey(...)
migrationBuilder.AddForeignKey(...)
onDelete: ReferentialAction.Cascade
onDelete: ReferentialAction.Restrict
onDelete: ReferentialAction.SetNull
```

If any of these appear, fix the entity/configuration and recreate the migration.

