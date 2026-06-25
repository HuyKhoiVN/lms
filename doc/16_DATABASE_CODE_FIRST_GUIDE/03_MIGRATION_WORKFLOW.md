# EF Core Migration Workflow

## 1. Purpose

This document defines the exact workflow for creating and applying EF Core migrations for the `lms` SQL Server database.

The database must be created and evolved through migrations from C# entity and mapping code.

## 2. Required Projects

Migration project:

```txt
src/lms/lms.Persistence
```

Startup project:

```txt
src/lms/lms.Api
```

Connection string location:

```txt
src/lms/lms.Api/appsettings.json
```

Connection string key:

```txt
ConnectionStrings:LmsDb
```

## 3. Required Packages

`lms.Persistence` should reference:

```txt
Microsoft.EntityFrameworkCore
Microsoft.EntityFrameworkCore.SqlServer
Microsoft.EntityFrameworkCore.Design
```

`lms.Api` should be able to load and register Persistence services.

## 4. Expected Dependency Direction

Allowed:

```txt
lms.Persistence -> lms.Domain
lms.Persistence -> lms.Application
lms.Api -> lms.Application
lms.Api -> lms.Persistence
```

Not allowed:

```txt
lms.Domain -> lms.Persistence
lms.Application -> lms.Persistence
lms.WebMvc -> lms.Persistence
```

## 5. DbContext Registration Rule

Register `LmsDbContext` from API composition root using the connection string.

Short example:

```csharp
builder.Services.AddDbContext<LmsDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("LmsDb"));
});
```

This code belongs in API/Persistence dependency injection setup, not inside Domain or WebMvc.

## 6. Before Creating A Migration

Complete this checklist:

- Entity created in `lms.Domain/Entities`.
- Enum created in `lms.Domain/Enums` if needed.
- Entity inherits `AuditableEntity` when it is a business table.
- `DbSet` added to `LmsDbContext`.
- Configuration added in `lms.Persistence/Configurations`.
- Configuration uses `ToTable`, `HasKey`, `Property`, `HasIndex`.
- Configuration does not use relationship mapping.
- No navigation properties exist on the entity.
- All logical references are scalar Id fields.
- Column naming uses PascalCase.
- Table naming uses plural PascalCase.
- Decimal fields have explicit precision.
- Long text fields are configured intentionally.
- Soft-delete behavior is clear.
- Application service validation plan exists for logical references.

## 7. Create Migration

From solution root:

```bash
cd src/lms
dotnet ef migrations add InitialIdentity --project lms.Persistence --startup-project lms.Api --context LmsDbContext
```

Use a descriptive migration name:

```bash
dotnet ef migrations add AddQuestionBankSchema --project lms.Persistence --startup-project lms.Api --context LmsDbContext
```

Recommended migration names:

```txt
InitialIdentity
AddGroupCourseSchema
AddLearningSchema
AddQuestionBankSchema
AddExamManagementSchema
AddExamRuntimeSchema
AddResultCertificateSchema
AddReportingOptimization
```

## 8. Review Migration Before Applying

Open the generated migration file in:

```txt
src/lms/lms.Persistence/Migrations
```

Search for forbidden patterns:

```txt
ForeignKey
AddForeignKey
onDelete
ReferentialAction
```

Using ripgrep:

```bash
rg -n "ForeignKey|AddForeignKey|onDelete|ReferentialAction" src/lms/lms.Persistence/Migrations
```

Expected result:

```txt
No matches
```

If there are matches:

1. Remove the migration.
2. Fix entity/configuration.
3. Recreate migration.

Remove latest migration before applying:

```bash
dotnet ef migrations remove --project lms.Persistence --startup-project lms.Api --context LmsDbContext
```

## 9. Apply Migration

After review passes:

```bash
dotnet ef database update --project lms.Persistence --startup-project lms.Api --context LmsDbContext
```

This should create the SQL Server database automatically if it does not already exist.

Do not create the database manually first.

## 10. Validate SQL Server Schema

After applying migration, verify that there are no foreign key constraints:

```sql
SELECT name
FROM sys.foreign_keys;
```

Expected:

```txt
0 rows
```

Verify tables:

```sql
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

Verify columns for a table:

```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Users'
ORDER BY ORDINAL_POSITION;
```

## 11. Validate Migration History

EF Core stores applied migrations in:

```txt
__EFMigrationsHistory
```

Check applied migrations:

```sql
SELECT *
FROM __EFMigrationsHistory
ORDER BY MigrationId;
```

## 12. Build Verification

Before and after migration work, run:

```bash
dotnet build
```

From:

```txt
src/lms
```

The solution must compile before migration is considered complete.

## 13. Migration Checklist

### Before Migration

- [ ] Entity is in correct project.
- [ ] Configuration is in correct project.
- [ ] DbContext is in `lms.Persistence`.
- [ ] Connection string key is `LmsDb`.
- [ ] No navigation properties.
- [ ] No relationship Fluent API.
- [ ] Logical reference Ids are scalar properties.
- [ ] Audit fields are present.
- [ ] Naming rules are followed.
- [ ] Indexes are reviewed.

### During Migration Review

- [ ] Migration creates expected tables.
- [ ] Migration creates expected columns.
- [ ] Migration creates expected indexes.
- [ ] Migration does not contain `ForeignKey`.
- [ ] Migration does not contain `AddForeignKey`.
- [ ] Migration does not contain cascade delete.
- [ ] Migration does not rename `IsDelete`.
- [ ] Migration does not rename `UpdateDate`.

### After Database Update

- [ ] SQL Server database exists.
- [ ] Expected tables exist.
- [ ] `sys.foreign_keys` returns 0 rows.
- [ ] `__EFMigrationsHistory` contains migration.
- [ ] Application starts successfully.
- [ ] Integration smoke test can connect to database.

## 14. Handling Wrong Migration

If migration has not been applied:

```bash
dotnet ef migrations remove --project lms.Persistence --startup-project lms.Api --context LmsDbContext
```

If migration has already been applied in local development:

```bash
dotnet ef database update PreviousMigrationName --project lms.Persistence --startup-project lms.Api --context LmsDbContext
dotnet ef migrations remove --project lms.Persistence --startup-project lms.Api --context LmsDbContext
```

Do not use destructive database reset on shared environments.

## 15. Local Development Reset

For local-only development, if the database has no important data, the database can be dropped through EF:

```bash
dotnet ef database drop --project lms.Persistence --startup-project lms.Api --context LmsDbContext
dotnet ef database update --project lms.Persistence --startup-project lms.Api --context LmsDbContext
```

Only do this for local development databases.

Do not drop shared, staging, or production databases.

## 16. Recommended Migration Review Command

Run this before applying any migration:

```bash
dotnet build
rg -n "ForeignKey|AddForeignKey|onDelete|ReferentialAction" src/lms/lms.Persistence/Migrations
```

Expected:

- Build succeeds.
- `rg` finds no FK-related migration code.

## 17. Service Validation After Migration

Because the database does not enforce foreign keys, each feature must add service-level validation.

Examples:

```txt
CourseAssignmentService:
  - Check Course exists.
  - Check User exists.
  - Check duplicate assignment.

ExamAttemptService:
  - Check Exam exists.
  - Check User can take exam.
  - Check attempt limit.
  - Check exam is published.

AttemptAnswerService:
  - Check Attempt exists.
  - Check Attempt belongs to current user.
  - Check Attempt is still active.
  - Check selected SnapshotAnswerIds belong to that attempt.
```

## 18. Definition Of Done For Database Changes

A database change is done only when:

- C# entity is complete.
- EF configuration is complete.
- Migration is generated.
- Migration is reviewed.
- No FK constraint is generated.
- Database update succeeds.
- SQL Server validation confirms 0 foreign keys.
- Build succeeds.
- Application/service validation exists or is planned in the module task.

