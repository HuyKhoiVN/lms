# 05_DATABASE_DESIGN.md

# Database Design Blueprint

## Purpose

This document defines the database design rules for project `lms`.

Database:

```txt
SQL Server
```

ORM:

```txt
Entity Framework Core
```

Database Approach:

```txt
Database First
```

Important:

The database is designed and maintained first in SQL Server.

C# models and DbContext are generated from database using:

```txt
Scaffold-DbContext
```

---

# 1. Core Database Rules

## 1.1 No Hard Foreign Keys

The database must NOT use hard foreign key constraints.

Do not create physical FK constraints in SQL Server.

Relationships are handled by:

```txt
Id
SubId
ReferenceId
Code
```

and joined in query logic.

Example:

```txt
ExamAttempts.ExamId joins Exams.Id
ExamAttempts.UserId joins Users.Id
```

But SQL Server must not enforce this with a foreign key constraint.

Reason:

* Flexible migration
* Easier integration with existing C3 system
* Avoid hard dependency between modules
* Easier data migration and partial import

---

## 1.2 Primary Key Type

All table primary keys use:

```sql
Id INT IDENTITY(1,1) PRIMARY KEY
```

Do NOT use:

```sql
UNIQUEIDENTIFIER
```

unless explicitly required for public token/code.

---

## 1.3 Common Columns

All business tables must contain:

```sql
CreatedDate DATETIME NULL
UpdateDate DATETIME NULL
CreatedBy INT NULL
UpdatedBy INT NULL
IsDelete BIT NOT NULL DEFAULT 0
```

Required common columns:

| Column      | Type     | Description                |
| ----------- | -------- | -------------------------- |
| CreatedDate | DATETIME | Created time               |
| UpdateDate  | DATETIME | Last updated time          |
| CreatedBy   | INT      | User Id who created record |
| UpdatedBy   | INT      | User Id who updated record |
| IsDelete    | BIT      | Soft delete flag           |

Naming must be exactly:

```txt
CreatedDate
UpdateDate
CreatedBy
UpdatedBy
IsDelete
```

Do not use:

```txt
IsDeleted
UpdatedDate
ModifiedDate
DeletedDate
```

---

# 2. Migration Direction

## 2.1 Migration Source

Database migration is from:

```txt
C3 -> lms Database
```

The target database schema must support importing data from C3.

---

## 2.2 EF Core Generation

C# Entity and DbContext must be generated from SQL Server using:

```bash
Scaffold-DbContext
```

Example command:

```bash
Scaffold-DbContext "Name=ConnectionStrings:LmsDb" Microsoft.EntityFrameworkCore.SqlServer -OutputDir Entities -Context LmsDbContext -ContextDir Context -DataAnnotations -Force
```

Or using dotnet CLI:

```bash
dotnet ef dbcontext scaffold "Name=ConnectionStrings:LmsDb" Microsoft.EntityFrameworkCore.SqlServer --output-dir Entities --context LmsDbContext --context-dir Context --data-annotations --force
```

---

# 3. Connection String Rule

Connection string must be read from:

```txt
webconfig.json
```

The developer will manually update this file.

Example:

```json
{
  "ConnectionStrings": {
    "LmsDb": "Server=.;Database=lms;User Id=sa;Password=your_password;TrustServerCertificate=True;"
  }
}
```

Application must not hardcode connection string.

---

# 4. EF Core Rules

## 4.1 DbContext Location

Generated DbContext must be placed in:

```txt
lms.Persistence
```

Suggested structure:

```txt
lms.Persistence
├── Context
│   └── LmsDbContext.cs
├── Entities
│   ├── User.cs
│   ├── Course.cs
│   ├── Exam.cs
│   └── ...
```

---

## 4.2 Entity Generation

Entities are generated from database.

Do not manually create entity classes first.

Correct flow:

```txt
Create/Update SQL Server Tables
        ↓
Run Scaffold-DbContext
        ↓
Generate C# Entities
        ↓
Use generated entities in Persistence/Application
```

---

## 4.3 No EF Migration First

Do not use Code First migration as the primary approach.

Avoid:

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

Use Database First instead.

---

# 5. Table Design Convention

## Table Naming

Use PascalCase.

Examples:

```txt
Users
Roles
Courses
LearningMaterials
Questions
Exams
ExamAttempts
```

---

## Column Naming

Use PascalCase.

Examples:

```txt
Id
UserName
FullName
ExamId
CourseId
CreatedDate
UpdateDate
IsDelete
```

---

## Status Columns

Use simple int or varchar depending on module.

Recommended:

```sql
Status INT NULL
```

or:

```sql
Status NVARCHAR(50) NULL
```

---

# 6. Module Tables

## Identity

```txt
Users
Roles
UserRoles
RefreshTokens
```

---

## User Management

```txt
Users
UserProfiles
```

---

## Group Management

```txt
Groups
GroupUsers
```

---

## Course Management

```txt
Courses
CourseAssignments
```

---

## Learning Materials

```txt
LearningMaterials
LearningProgress
```

---

## Question Bank

```txt
QuestionCategories
Questions
AnswerOptions
```

---

## Exam Management

```txt
Exams
ExamQuestions
ExamRandomRules
ExamAssignments
```

---

## Exam Runtime

```txt
ExamAttempts
AttemptQuestionSnapshots
AttemptAnswerSnapshots
AttemptAnswers
```

---

## Results

```txt
ExamResults
```

---

## Certificates

```txt
Certificates
```

---

## Reports

No dedicated report tables in MVP.

Reports are generated from transaction tables.

---

## Audit Logs

```txt
AuditLogs
```

---

# 7. Required Table Structure Example

## Users

```sql
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    UserName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NULL,
    PasswordHash NVARCHAR(MAX) NULL,
    FullName NVARCHAR(255) NULL,
    IsLocked BIT NOT NULL DEFAULT 0,
    LastLoginDate DATETIME NULL,

    CreatedDate DATETIME NULL,
    UpdateDate DATETIME NULL,
    CreatedBy INT NULL,
    UpdatedBy INT NULL,
    IsDelete BIT NOT NULL DEFAULT 0
);
```

---

## Exams

```sql
CREATE TABLE Exams (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    Code NVARCHAR(50) NULL,
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NULL,

    DurationMinutes INT NOT NULL,
    PassScore DECIMAL(18,2) NOT NULL,
    AttemptLimit INT NULL,

    RandomQuestion BIT NOT NULL DEFAULT 0,
    RandomAnswer BIT NOT NULL DEFAULT 0,

    ReviewMode NVARCHAR(50) NULL,

    ShowCorrectAnswers BIT NOT NULL DEFAULT 0,
    ShowSelectedAnswers BIT NOT NULL DEFAULT 1,
    ShowQuestionReview BIT NOT NULL DEFAULT 1,

    IsPublished BIT NOT NULL DEFAULT 0,

    CreatedDate DATETIME NULL,
    UpdateDate DATETIME NULL,
    CreatedBy INT NULL,
    UpdatedBy INT NULL,
    IsDelete BIT NOT NULL DEFAULT 0
);
```

---

## ExamAttempts

```sql
CREATE TABLE ExamAttempts (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    ExamId INT NOT NULL,
    UserId INT NOT NULL,

    StartedAt DATETIME NULL,
    SubmittedAt DATETIME NULL,

    DurationMinutes INT NULL,
    Status NVARCHAR(50) NULL,

    Score DECIMAL(18,2) NULL,
    Passed BIT NULL,

    CreatedDate DATETIME NULL,
    UpdateDate DATETIME NULL,
    CreatedBy INT NULL,
    UpdatedBy INT NULL,
    IsDelete BIT NOT NULL DEFAULT 0
);
```

Note:

```txt
ExamId and UserId are logical references only.
No SQL Server foreign key constraint.
```

---

# 8. Logical Relationship Rules

Relationships are logical only.

Example:

```txt
Users.Id = ExamAttempts.UserId
Exams.Id = ExamAttempts.ExamId
Questions.Id = AnswerOptions.QuestionId
ExamAttempts.Id = AttemptAnswers.AttemptId
```

SQL Server should not enforce these as FK constraints.

Application or query layer is responsible for join correctness.

---

# 9. Soft Delete Rule

Use:

```txt
IsDelete
```

to mark deleted records.

Query default rule:

```sql
WHERE IsDelete = 0
```

Do not physically delete master data.

Soft delete applies to:

```txt
Users
Groups
Courses
LearningMaterials
QuestionCategories
Questions
AnswerOptions
Exams
```

Transaction tables should normally not be deleted:

```txt
ExamAttempts
ExamResults
Certificates
AuditLogs
```

---

# 10. Audit Rule

Audit data must be recorded for important actions:

```txt
Login
Logout
Create
Update
Delete
Assign
Submit Exam
Generate Certificate
Export Report
```

AuditLogs table:

```sql
CREATE TABLE AuditLogs (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    UserId INT NULL,
    Action NVARCHAR(100) NULL,
    EntityName NVARCHAR(100) NULL,
    EntityId INT NULL,
    BeforeData NVARCHAR(MAX) NULL,
    AfterData NVARCHAR(MAX) NULL,

    CreatedDate DATETIME NULL,
    UpdateDate DATETIME NULL,
    CreatedBy INT NULL,
    UpdatedBy INT NULL,
    IsDelete BIT NOT NULL DEFAULT 0
);
```

Audit logs should be treated as append-only in application logic.

---

# 11. Critical Exam Data Rules

## Exam Snapshot

When user starts an exam, the system must create snapshot data.

Required tables:

```txt
AttemptQuestionSnapshots
AttemptAnswerSnapshots
```

Reason:

If admin updates question or answer later, old attempts must not change.

---

## Submit Rule

Only first submit is accepted.

Repeated submit requests must return existing result.

---

## Correct Answer Rule

Correct answers must not be exposed to UI before submit.

---

# 12. Database First Workflow For AI

When AI works on database-related tasks, follow this order:

```txt
1. Update SQL table definition
2. Do not add hard foreign keys
3. Ensure Id is INT IDENTITY
4. Ensure common columns exist:
   - CreatedDate
   - UpdateDate
   - CreatedBy
   - UpdatedBy
   - IsDelete
5. Run Scaffold-DbContext
6. Review generated entities
7. Do not manually rewrite generated entities unless necessary
8. Put business logic outside generated entity classes
```

---

# 13. Important AI Restrictions

AI must NOT:

```txt
- Use Guid as default Id type
- Add SQL Server foreign key constraints
- Use Code First as primary approach
- Hardcode connection string
- Rename IsDelete to IsDeleted
- Rename UpdateDate to UpdatedDate
- Place DbContext in lms.Api
- Let lms.WebMvc access database directly
```

AI must:

```txt
- Use int Id
- Use logical joins
- Use SQL Server
- Use Scaffold-DbContext
- Read connection string from webconfig.json
- Keep database and C# code separated
```
