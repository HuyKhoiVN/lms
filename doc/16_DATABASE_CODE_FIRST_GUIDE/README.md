# Database Code First Guide

This folder is the official database development guide for the current backend direction of project `lms`.

The project uses:

- SQL Server
- Entity Framework Core
- Code First
- EF Core Migration
- Connection string from `appsettings.json`

The database must be generated from C# entity and EF Core configuration through migration. Do not create the database manually before running migration.

## Important Decision

`doc/05_DATABASE_DESIGN.md` was written for an older Database First / Scaffold-DbContext direction.

For the current backend database implementation, use this folder as the active guide:

```txt
C# Entity
  -> EF Core Configuration
  -> LmsDbContext
  -> EF Core Migration
  -> SQL Server Database
```

Do not use:

- Database First
- Scaffold-DbContext
- Manual SQL table creation as the primary workflow
- Hard foreign key constraints

## Documents

1. `01_ARCHITECTURE_AND_ROADMAP.md`
   - Overall database architecture
   - Module table roadmap
   - Development priority

2. `02_ENTITY_AND_MAPPING_RULES.md`
   - Entity design rules
   - DbContext and configuration structure
   - Naming, key, audit, index conventions
   - No-FK mapping rules

3. `03_MIGRATION_WORKFLOW.md`
   - Migration workflow
   - EF CLI commands
   - Checklist before and after migration
   - SQL Server validation queries

## Non-Negotiable Rules

- No database foreign key constraints.
- No EF relationship mapping that generates foreign key constraints.
- Use logical reference columns only, such as `UserId`, `CourseId`, `ExamId`, `QuestionId`, `LessonId`, `AttemptId`.
- Validate related data in Application/Service layer.
- Keep `DbContext` and migrations in `lms.Persistence`.
- Keep domain entities in `lms.Domain`.
- Keep `lms.WebMvc` UI-only. It must not access the database.

