# 08_DEFINITION_OF_DONE.md

# Definition of Done (DoD)

## Purpose

This document defines the minimum quality requirements before a task, feature, module, or release can be considered completed.

All developers and AI agents must validate against this checklist before marking work as completed.

A task is NOT considered complete simply because the code compiles.

---

# 1. General Definition of Done

A feature is considered Done only when:

* Requirements are implemented
* Code builds successfully
* No architecture violations exist
* UI is functional
* API contract is respected
* Database changes are completed
* Validation is implemented
* Logging is implemented
* Error handling exists
* Security rules are respected
* Testing is completed

---

# 2. Architecture Validation

The implementation must follow project architecture.

## Backend

Must follow:

```txt id="rv3ll0"
Domain
Application
Persistence
Infrastructure
Api
```

---

## Frontend

Must follow:

```txt id="1bzvyo"
lms.WebMvc
```

---

## Validation Checklist

### Pass

```txt id="ktufgn"
Domain has no infrastructure dependency

Application has no database dependency

Controllers are thin

Business logic is not in controllers

Business logic is not in views

DbContext is in Persistence
```

### Fail

```txt id="1ot40y"
Controller contains business logic

View calls database

Api accesses SQL directly

Application references Infrastructure
```

---

# 3. Database Checklist

For any database-related task:

## Required

```txt id="c1hx4f"
Table created

Columns validated

Indexes reviewed

Scaffold-DbContext executed

Generated entities reviewed
```

---

## Naming Validation

Every table must follow:

```txt id="hx8oqg"
PascalCase
```

Every table must contain:

```txt id="ojzq8h"
CreatedDate
UpdateDate
CreatedBy
UpdatedBy
IsDelete
```

---

## Foreign Key Validation

Pass

```txt id="u8wjr6"
Logical relationship only
```

Fail

```txt id="lsv1q0"
Hard SQL Server foreign keys
```

---

# 4. API Checklist

For every API endpoint:

## Required

```txt id="6f4o31"
Route exists

Authorization exists

Validation exists

Logging exists

Error handling exists
```

---

## Response Format

Success

```json id="o9bz2o"
{
  "success": true,
  "data": {}
}
```

Error

```json id="mjlwmh"
{
  "success": false,
  "message": "",
  "errors": []
}
```

---

## Security Validation

Verify:

```txt id="nsmwd4"
Unauthorized user cannot access endpoint

Admin-only endpoint protected

Sensitive data hidden
```

---

# 5. Frontend Checklist

For every screen:

## Required

```txt id="t7wjlwm"
Page loads

Menu works

Buttons work

Validation works

Responsive layout works

No console errors
```

---

## UI Consistency

Verify:

```txt id="j53m1o"
Uses shared layout

Uses shared components

Uses approved colors

Uses approved typography
```

---

## Not Allowed

```txt id="q4nrbg"
Inline styles everywhere

Duplicate page layout

Business logic inside HTML
```

---

# 6. Form Validation Checklist

Every form must validate:

## Client Side

```txt id="yjlwmz"
Required fields

Format validation

Length validation
```

---

## Server Side

```txt id="1jot9f"
Request validation

Business validation
```

---

## Validation Messages

Must be:

```txt id="7vlaz8"
Clear

Friendly

Actionable
```

---

# 7. Authentication Checklist

Login module is done only if:

```txt id="1xeh8p"
Login works

Logout works

JWT works

Refresh token works

Unauthorized requests rejected
```

---

# 8. User Management Checklist

Done when:

```txt id="r8m9oo"
Create user works

Edit user works

Lock user works

Reset password works
```

---

# 9. Learning Module Checklist

Done when:

```txt id="vjlwmu"
Material loads

Progress updates

Completion status updates
```

---

# 10. Question Bank Checklist

Done when:

```txt id="v5trd7"
Question creation works

Question editing works

Question deletion works

Single choice works

Multiple choice works
```

---

# 11. Exam Management Checklist

Done when:

```txt id="ob9rj0"
Exam creation works

Question assignment works

Publish works

Assignment works
```

---

# 12. Exam Engine Checklist

Critical Module

Done only when:

```txt id="o9st18"
Start exam works

Timer works

Navigation works

Autosave works

Submit works

Auto submit works
```

---

## Snapshot Validation

Verify:

```txt id="ccjlwm"
Attempt snapshot created

Snapshot immutable
```

---

## Security Validation

Verify:

```txt id="mf1s8m"
Correct answers not returned

Question data protected
```

---

# 13. Scoring Checklist

Done when:

```txt id="n7jw08"
Single choice scoring correct

Multiple choice scoring correct

Pass score calculation correct
```

---

# 14. Results Checklist

Done when:

```txt id="mkckoq"
Result generated

Result displayed

History displayed

Review policy respected
```

---

# 15. Certificate Checklist

Done when:

```txt id="hjlwm5"
Certificate generated

PDF generated

Download works

Certificate code unique
```

---

# 16. Reporting Checklist

Done when:

```txt id="r5e2do"
Report data correct

Charts render

Excel export works

PDF export works
```

---

# 17. Audit Checklist

Done when:

```txt id="5zwg2g"
Create logged

Update logged

Delete logged

Login logged

Submit exam logged
```

---

## Validation

Audit logs must be:

```txt id="z5kgqb"
Append-only
```

No updates.

No deletes.

---

# 18. Error Handling Checklist

Verify:

```txt id="x4cq8z"
Global exception middleware works

Friendly error message returned

System errors logged
```

---

# 19. Logging Checklist

Verify:

```txt id="4n4v50"
Information logs

Warning logs

Error logs
```

No:

```txt id="0x9o0m"
Console.WriteLine
```

---

# 20. Performance Checklist

Verify:

```txt id="c5ytkl"
Login < 3 seconds

Load exam < 5 seconds

Submit exam < 5 seconds
```

---

# 21. Security Checklist

Verify:

```txt id="6wjlwm"
Passwords hashed

JWT validated

Authorization enforced

Sensitive data protected
```

---

# 22. Code Quality Checklist

Verify:

```txt id="9ivvhn"
No duplicated code

Meaningful naming

No dead code

No commented-out legacy code
```

---

# 23. Pull Request Checklist

Before merging:

```txt id="3j6k2j"
Build successful

No compile errors

No warnings that affect functionality

Manual testing completed
```

---

# 24. AI Completion Checklist

Before AI marks task complete:

### Architecture

```txt id="4sh0xn"
Architecture rules followed
```

### Database

```txt id="9a0z2w"
Database rules followed
```

### API

```txt id="1y2vkv"
API contract followed
```

### Frontend

```txt id="efslgh"
UI standards followed
```

### Security

```txt id="knjlwm"
Security rules followed
```

### Testing

```txt id="dd4qk0"
Scenario tested
```

All items must be TRUE.

If any item is FALSE:

```txt id="6v87k7"
Task status = NOT DONE
```

---

# 25. Release Definition of Done

The MVP release is complete only when:

```txt id="bwwr2v"
Authentication complete

User Management complete

Course Management complete

Learning Materials complete

Question Bank complete

Exam Management complete

Exam Engine complete

Scoring complete

Results complete

Reporting complete

Audit Logs complete
```

and

```txt id="c7w7qv"
End-to-end testing passed
```

for the following scenarios:

```txt id="8o7gso"
Admin creates exam

Admin assigns exam

Student completes learning

Student takes exam

System scores exam

Student views result

Student downloads certificate

Admin views reports
```

without manual database intervention.
