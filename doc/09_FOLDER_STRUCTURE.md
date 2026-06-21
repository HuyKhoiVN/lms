# 09_FOLDER_STRUCTURE.md

# Solution Structure & Folder Convention

## Purpose

This document defines the official folder structure for the lms solution.

All developers and AI agents must follow this structure.

Do not create arbitrary folders.

Do not place files in incorrect layers.

---

# 1. Solution Structure

```txt id="s9ko4r"
lms
│
├── docs
│
├── src
│   ├── lms.Domain
│   ├── lms.Application
│   ├── lms.Persistence
│   ├── lms.Infrastructure
│   ├── lms.Api
│   └── lms.WebMvc
│
├── tests
│   ├── lms.UnitTests
│   └── lms.IntegrationTests
│
└── scripts
```

---

# 2. Docs Structure

```txt id="zztqj0"
docs
│
├── 01_PROJECT_VISION.md
├── 02_AI_WORKFLOW.md
├── 03_CODING_STANDARDS.md
├── 04_API_CONTRACT.md
├── 05_DATABASE_DESIGN.md
├── 06_UI_COMPONENTS.md
├── 07_MODULE_BACKLOG.md
├── 08_DEFINITION_OF_DONE.md
├── 09_FOLDER_STRUCTURE.md
└── 10_DEVELOPMENT_PROMPTS.md
```

---

# 3. Domain Structure

Project:

```txt id="onodzm"
lms.Domain
```

Purpose:

```txt id="34j05p"
Business entities only
```

Structure

```txt id="hphbzz"
lms.Domain
│
├── Common
│
├── Entities
│
├── Enums
│
├── Constants
│
├── ValueObjects
│
└── Events
```

---

## Common

```txt id="cyssfr"
BaseEntity.cs
AuditableEntity.cs
```

---

## Entities

```txt id="xrmz5v"
User.cs
Role.cs

Group.cs

Course.cs

LearningMaterial.cs

Question.cs
AnswerOption.cs

Exam.cs
ExamAttempt.cs

ExamResult.cs

Certificate.cs

AuditLog.cs
```

---

## Enums

```txt id="p1crgm"
QuestionType.cs

DifficultyLevel.cs

ReviewMode.cs

ExamStatus.cs

UserStatus.cs
```

---

# 4. Application Structure

Project

```txt id="p7rjys"
lms.Application
```

Purpose

```txt id="c7fov4"
Business logic
Use cases
DTOs
Validation
```

---

Structure

```txt id="gphc3v"
lms.Application
│
├── Common
│
├── Interfaces
│
├── DTOs
│
├── Validators
│
├── Services
│
├── Features
│
└── Mappings
```

---

# 5. Features Structure

Every module must have its own feature folder.

Example:

```txt id="0e66q5"
Features
│
├── Authentication
├── Users
├── Groups
├── Courses
├── LearningMaterials
├── Questions
├── Exams
├── ExamAttempts
├── Results
├── Reports
└── Certificates
```

---

# 6. Feature Structure Template

Example:

```txt id="a2wefc"
Features
│
└── Users
    │
    ├── Commands
    │
    ├── Queries
    │
    ├── DTOs
    │
    ├── Validators
    │
    └── Services
```

---

Example:

```txt id="7uj06x"
Users
│
├── Commands
│   ├── CreateUser
│   ├── UpdateUser
│   └── LockUser
│
├── Queries
│   ├── GetUser
│   └── GetUsers
│
├── DTOs
│
└── Validators
```

---

# 7. Persistence Structure

Project

```txt id="zyqjyi"
lms.Persistence
```

Purpose

```txt id="vovl0k"
Database access
Generated entities
DbContext
```

---

Structure

```txt id="fhhphv"
lms.Persistence
│
├── Context
│
├── Entities
│
├── Repositories
│
├── Views
│
├── Sql
│
└── Seed
```

---

# 8. Context Structure

```txt id="09zqu7"
Context
│
└── LmsDbContext.cs
```

Generated from:

```txt id="hckv7m"
Scaffold-DbContext
```

---

# 9. Generated Entity Structure

```txt id="5n6dgu"
Entities
│
├── User.cs
├── Course.cs
├── Question.cs
├── Exam.cs
└── ...
```

Important:

```txt id="26t31w"
Do not manually edit generated entities.
```

If DB changes:

```txt id="8k7v1t"
Run Scaffold-DbContext again.
```

---

# 10. Repository Structure

```txt id="v2mwya"
Repositories
│
├── UserRepository.cs
├── CourseRepository.cs
├── ExamRepository.cs
└── ...
```

Only data access logic.

No business rules.

---

# 11. Infrastructure Structure

Project

```txt id="0clj9d"
lms.Infrastructure
```

Purpose

```txt id="7xry5o"
External services
```

---

Structure

```txt id="13b9v8"
lms.Infrastructure
│
├── Authentication
│
├── Storage
│
├── Pdf
│
├── Export
│
├── Logging
│
└── Services
```

---

# 12. Authentication Structure

```txt id="ygjlwm"
Authentication
│
├── JwtTokenService.cs
├── RefreshTokenService.cs
└── PasswordHasherService.cs
```

---

# 13. Storage Structure

```txt id="olijv5"
Storage
│
├── LocalStorageService.cs
└── FileStorageService.cs
```

---

# 14. PDF Structure

```txt id="d8nq33"
Pdf
│
└── CertificatePdfGenerator.cs
```

---

# 15. Export Structure

```txt id="mgh0hg"
Export
│
├── ExcelExportService.cs
└── PdfExportService.cs
```

---

# 16. API Structure

Project

```txt id="fjjlwm"
lms.Api
```

Purpose

```txt id="tjlwm5"
REST API
```

---

Structure

```txt id="2wjlwm"
lms.Api
│
├── Controllers
│
├── Middlewares
│
├── Filters
│
├── Extensions
│
├── Configurations
│
└── Models
```

---

# 17. Controller Structure

One controller per module.

```txt id="pmf02l"
Controllers
│
├── AuthController.cs
├── UsersController.cs
├── GroupsController.cs
├── CoursesController.cs
├── QuestionsController.cs
├── ExamsController.cs
├── ResultsController.cs
└── ReportsController.cs
```

---

# 18. Middleware Structure

```txt id="uaxvkn"
Middlewares
│
├── ExceptionMiddleware.cs
├── AuditMiddleware.cs
└── RequestLoggingMiddleware.cs
```

---

# 19. Configuration Structure

```txt id="1jlwmr"
Configurations
│
├── JwtConfiguration.cs
├── SwaggerConfiguration.cs
└── ServiceConfiguration.cs
```

---

# 20. WebMvc Structure

Project

```txt id="7jlwm9"
lms.WebMvc
```

Purpose

```txt id="mrjlwm"
UI only
```

---

Structure

```txt id="4jlwm5"
lms.WebMvc
│
├── Controllers
│
├── Views
│
├── Models
│
├── Services
│
└── wwwroot
```

---

# 21. MVC Controllers

Routing only.

```txt id="zwjlwm"
Controllers
│
├── AuthController.cs
├── DashboardController.cs
├── UsersController.cs
├── CoursesController.cs
├── QuestionsController.cs
├── ExamsController.cs
└── ReportsController.cs
```

No business logic.

No database access.

---

# 22. Views Structure

```txt id="xjlwmn"
Views
│
├── Shared
│
├── Auth
│
├── Dashboard
│
├── Users
│
├── Groups
│
├── Courses
│
├── LearningMaterials
│
├── Questions
│
├── Exams
│
├── Results
│
├── Reports
│
└── AuditLogs
```

---

# 23. Shared Views

```txt id="3jlwmn"
Shared
│
├── _Layout.cshtml
│
├── Components
│
└── Partials
```

Note:

```txt id="sjlwm9"
Razor only for layout composition.

Business data loads through AJAX.
```

---

# 24. wwwroot Structure

```txt id="jlwm88"
wwwroot
│
├── css
├── js
├── images
├── fonts
└── mock
```

---

# 25. CSS Structure

```txt id="mjlwm7"
css
│
├── layout.css
├── components.css
├── pages.css
└── utilities.css
```

---

# 26. JavaScript Structure

```txt id="zjlwm6"
js
│
├── core
│
├── services
│
├── components
│
└── pages
```

---

# 27. Core JavaScript

```txt id="pjlwm5"
core
│
├── config.js
├── auth.js
├── api-client.js
├── storage.js
└── ui.js
```

---

# 28. Services JavaScript

```txt id="ojlwm4"
services
│
├── user-service.js
├── course-service.js
├── question-service.js
├── exam-service.js
└── report-service.js
```

---

# 29. Page JavaScript

```txt id="njlwm3"
pages
│
├── login.js
├── dashboard.js
├── users.js
├── courses.js
├── questions.js
├── exams.js
├── exam-taking.js
├── results.js
└── reports.js
```

---

# 30. Mock Data Structure

UI First phase only.

```txt id="mjlwm2"
mock
│
├── users.json
├── courses.json
├── questions.json
├── exams.json
├── attempts.json
└── results.json
```

---

# 31. Test Project Structure

```txt id="ljlwm1"
tests
│
├── lms.UnitTests
└── lms.IntegrationTests
```

---

# 32. Scripts Structure

```txt id="kjlwm0"
scripts
│
├── database
├── deployment
└── maintenance
```

---

# 33. Namespace Convention

Must match folder structure.

Example:

```csharp
namespace lms.Application.Features.Users.Commands.CreateUser;
```

Avoid:

```csharp
namespace Helpers;
namespace Utils;
namespace CommonStuff;
```

---

# 34. Forbidden Folders

Do not create:

```txt id="jjlwm9"
Temp
NewFolder
Misc
Helpers
Utils
TestCode
OldCode
Backup
```

without explicit approval.

---

# 35. AI Folder Rules

Before creating a file:

1. Verify correct project.

2. Verify correct folder.

3. Verify correct namespace.

4. Reuse existing structure.

5. Do not invent new architecture.

If a folder does not exist:

```txt id="hjlwm8"
Ask whether it should be added
```

instead of creating arbitrary structures.
