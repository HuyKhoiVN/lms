# 03_CODING_STANDARDS.md

# Coding Standards

## Purpose

This document defines coding standards for the entire lms solution.

All generated code must follow these standards.

These rules apply to:

* Human developers
* AI agents
* Codex
* Cursor
* Claude Code
* GitHub Copilot

---

# 1. General Principles

Follow:

* SOLID
* Clean Code
* Clean Architecture
* DRY
* KISS

Avoid:

* God Classes
* Duplicate Logic
* Hardcoded Values
* Hidden Dependencies

---

# 2. Solution Structure

Solution Name

```txt
lms
```

Projects

```txt
lms.Domain
lms.Application
lms.Persistence
lms.Infrastructure
lms.Api
lms.WebMvc
```

---

# 3. Dependency Rules

Allowed:

```txt
Api
 └── Application

Application
 └── Domain

Persistence
 ├── Domain
 └── Application

Infrastructure
 ├── Domain
 └── Application
```

Forbidden:

```txt
Domain -> Any Project

Application -> Persistence

Application -> Infrastructure

WebMvc -> Domain

WebMvc -> Application

WebMvc -> Persistence

WebMvc -> Infrastructure
```

---

# 4. Naming Convention

## Classes

Use PascalCase

Good

```csharp
UserService
ExamAttempt
QuestionRepository
```

Bad

```csharp
userservice
user_service
```

---

## Methods

Use PascalCase

```csharp
GetUserById()
CreateExamAttempt()
SubmitExam()
```

---

## Properties

Use PascalCase

```csharp
UserName
CreatedDate
PassScore
```

---

## Variables

Use camelCase

```csharp
userId
examAttempt
questionList
```

---

## Constants

Use PascalCase

```csharp
MaxRetryCount
DefaultPageSize
```

Avoid magic numbers.

---

# 5. Domain Layer Rules

Domain contains:

* Entities
* Enums
* Value Objects
* Domain Events

Domain must not contain:

* EF Core
* Database Logic
* API Logic
* HTTP Logic

---

## Entity Example

```csharp
public class User : AuditableEntity
{
    public Guid Id { get; private set; }

    public string UserName { get; private set; }

    public bool IsLocked { get; private set; }

    public void Lock()
    {
        IsLocked = true;
    }
}
```

---

# 6. Application Layer Rules

Application contains:

* Use Cases
* DTOs
* Interfaces
* Validators
* Business Logic

Application must not contain:

* SQL
* DbContext
* HttpContext
* Controllers

---

## DTO Naming

```csharp
CreateUserRequest
CreateUserResponse

UpdateExamRequest
UpdateExamResponse
```

---

## Interface Naming

```csharp
IUserService
IExamService
IFileStorageService
```

---

# 7. Persistence Layer Rules

Persistence contains:

* DbContext
* EF Configurations
* Repositories
* Migrations

Persistence must not contain:

* Business Logic
* HTTP Logic

---

## EF Configuration

Never configure entities inside DbContext.

Use separate files.

Good:

```csharp
UserConfiguration
ExamConfiguration
QuestionConfiguration
```

---

# 8. Infrastructure Rules

Contains:

* JWT
* Email
* PDF
* File Storage

Infrastructure implements interfaces from Application.

Never expose infrastructure implementation to Domain.

---

# 9. API Rules

Controllers must remain thin.

Bad:

```csharp
Controller
 └── Business Logic
```

Good:

```csharp
Controller
 └── Application Service
```

---

## Endpoint Naming

Good

```txt
/api/users
/api/exams
/api/question-bank
```

Avoid

```txt
/api/getusers
/api/createexam
```

Use HTTP verbs properly.

---

## Response Format

Success

```json
{
  "success": true,
  "data": {}
}
```

Failure

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

# 10. Validation Rules

Use FluentValidation.

Never validate directly in controller.

Good

```txt
Controller
 -> Validator
 -> Service
```

Bad

```txt
Controller
 -> if statements
```

---

# 11. Exception Handling

Use global exception middleware.

Do not wrap every action with:

```csharp
try
{
}
catch
{
}
```

Only catch exceptions when business handling is required.

---

# 12. Logging Rules

Use ILogger.

Never:

```csharp
Console.WriteLine()
```

Log levels:

```txt
Information
Warning
Error
Critical
```

---

# 13. Database Rules

Database:

```txt
SQL Server
```

ORM:

```txt
EF Core
```

---

## Migrations

Only create migrations through EF Core.

Do not manually modify migration files unless necessary.

---

## Soft Delete

Use:

```csharp
IsDeleted
DeletedDate
DeletedBy
```

for master data.

Never physically delete business records.

---

# 14. Audit Rules

Audit required for:

* Login
* Logout
* Create
* Update
* Delete
* Assign
* Submit Exam
* Generate Certificate

Audit logs are append-only.

No update.

No delete.

---

# 15. Frontend Rules

Project:

```txt
lms.WebMvc
```

Purpose:

UI only.

---

## Allowed

* HTML
* CSS
* jQuery
* AJAX

---

## Not Allowed

* Direct SQL
* EF Core
* Business Logic
* Backend References

---

## Data Source

Always:

```txt
WebMvc
    ↓
REST API
```

Never:

```txt
WebMvc
    ↓
Database
```

---

# 16. JavaScript Standards

Use:

```javascript
const
let
```

Avoid:

```javascript
var
```

---

Separate files:

```txt
api-client.js
auth.js
users.js
courses.js
exams.js
```

Avoid giant JS files.

---

# 17. CSS Standards

Structure:

```txt
layout.css
components.css
utilities.css
pages.css
```

Do not write page-specific styles inside layout.css.

---

# 18. Security Rules

Passwords:

```txt
Hash only
Never store plaintext
```

JWT:

```txt
Access Token
Refresh Token
```

Never expose:

* Correct Answers
* Internal IDs
* Sensitive Data

before authorization.

---

# 19. Exam Rules

Exam Attempt is immutable.

After submit:

```txt
No update
```

Exam snapshot must exist.

Correct answers must not be returned before submit.

Autosave interval:

```txt
15-30 seconds
```

Submit must be idempotent.

Only first submit is accepted.

---

# 20. Definition of Good Code

Good code is:

* Readable
* Testable
* Maintainable
* Predictable

Every new feature should:

* Compile successfully
* Follow architecture rules
* Follow naming conventions
* Include validation
* Include logging
* Include authorization
* Include error handling

No exceptions.
