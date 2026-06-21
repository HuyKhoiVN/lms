# 10_DEVELOPMENT_PROMPTS.md

# AI Development Prompts

## Purpose

This document contains standardized prompts used by AI agents during development.

Goals:

* Consistent output
* Consistent architecture
* Faster development
* Reduced rework
* Reduced architecture violations

Before executing any task, AI must read:

```txt
01_PROJECT_VISION.md
03_CODING_STANDARDS.md
05_DATABASE_DESIGN.md
09_FOLDER_STRUCTURE.md
```

---

# Prompt Rules

Every implementation prompt must include:

```txt
Context
Requirements
Constraints
Expected Output
Validation Checklist
```

AI must:

1. Explain approach first.
2. List files to create.
3. List files to modify.
4. Then generate code.

---

# SECTION 1

## Create New UI Screen

### Prompt

```txt
You are working on project lms.

Read:
- 01_PROJECT_VISION.md
- 03_CODING_STANDARDS.md
- 06_UI_COMPONENTS.md
- 09_FOLDER_STRUCTURE.md

Task:

Create a new UI screen.

Requirements:

- Use existing layout
- Use existing sidebar
- Use existing header
- Use existing components
- Use HTML + CSS + jQuery
- Use mock JSON
- No API integration
- No business logic

Before coding:

1. Explain approach
2. List files
3. Generate code

Return complete implementation.
```

---

# SECTION 2

## Create New Module UI

### Prompt

```txt
You are implementing a new UI module.

Project:
lms.WebMvc

Requirements:

- Follow UI Design System
- Follow Folder Structure
- Follow Coding Standards

Create:

1. MVC Controller
2. Views
3. Page JavaScript
4. Mock Data

Use:

- HTML
- CSS
- jQuery

Do not:

- Access database
- Reference backend projects
- Implement backend logic

Provide complete implementation.
```

---

# SECTION 3

## Create SQL Table

### Prompt

```txt
You are implementing a database table.

Read:
- 05_DATABASE_DESIGN.md

Requirements:

- SQL Server
- INT IDENTITY primary key
- No foreign key constraints
- Logical relationships only

Required columns:

CreatedDate
UpdateDate
CreatedBy
UpdatedBy
IsDelete

Return:

1. CREATE TABLE script
2. Index recommendations
3. Notes for Scaffold-DbContext
```

---

# SECTION 4

## Generate Entity From Database

### Prompt

```txt
You are working in Database First mode.

Requirements:

- Database already exists
- Use Scaffold-DbContext
- Do not manually create entity

Provide:

1. Scaffold command
2. Folder destination
3. Expected generated files
4. Validation checklist
```

---

# SECTION 5

## Create Application Service

### Prompt

```txt
You are implementing Application Layer logic.

Read:
- 03_CODING_STANDARDS.md

Requirements:

- Business logic only
- No SQL
- No DbContext
- No HTTP

Provide:

1. DTOs
2. Service Interface
3. Service Implementation
4. Validation Rules
5. Error Handling
```

---

# SECTION 6

## Create API Module

### Prompt

```txt
You are implementing API endpoints.

Read:
- 04_API_CONTRACT.md

Requirements:

- Follow contract exactly
- Thin controller
- Validation required
- Authorization required
- Logging required

Provide:

1. Controller
2. Request Models
3. Response Models
4. Service Calls
5. Validation
```

---

# SECTION 7

## Create CRUD Module

### Prompt

```txt
Create a complete CRUD module.

Include:

- UI
- API
- Application
- Persistence

Requirements:

- Follow architecture
- Follow coding standards
- Follow folder structure

Return implementation by layer.
```

---

# SECTION 8

## Create Dashboard

### Prompt

```txt
Create dashboard screen.

Requirements:

Admin Dashboard

Cards:

- Total Users
- Total Courses
- Total Questions
- Total Exams

Charts:

- Pass Rate
- Exam Activity
- Score Distribution

Use mock data.

No API integration.
```

---

# SECTION 9

## Create Question Bank

### Prompt

```txt
Create Question Bank module.

Requirements:

Question List

Filters:
- Category
- Difficulty
- Search

Actions:
- Create
- Edit
- Delete

Question Editor:

Fields:
- Content
- Category
- Difficulty
- Score
- Answers

Support:
- Single Choice
- Multiple Choice

Use mock data.
```

---

# SECTION 10

## Create Exam Builder

### Prompt

```txt
Create Exam Builder screen.

Requirements:

Tabs:

- General
- Questions
- Assignment
- Settings

Features:

- Manual Question Selection
- Random Rules
- Review Policy
- Publish Exam

Use reusable components.

Use mock data.
```

---

# SECTION 11

## Create Exam Taking Screen

### Prompt

```txt
Create Exam Taking screen.

Requirements:

Components:

- Countdown Timer
- Question Navigator
- Question Content
- Answer Selection
- Previous
- Next
- Submit

Support:

- Single Choice
- Multiple Choice

Mock Features:

- Autosave
- Auto Submit

Do not show correct answers.
```

---

# SECTION 12

## Create Reporting Module

### Prompt

```txt
Create Reporting module.

Requirements:

Cards:
- Pass Rate
- Average Score
- Exam Count

Charts:
- Bar Chart
- Line Chart
- Pie Chart

Filters:
- Date Range
- Exam
- User

Export Buttons:
- Excel
- PDF

Use mock data.
```

---

# SECTION 13

## Create Integration Layer

### Prompt

```txt
Replace mock data with API integration.

Requirements:

- Keep UI unchanged
- Replace mock service only
- Use api-client.js
- Use JWT token
- Handle 401 redirect

Support:

useMock = true
useMock = false

Return only required modifications.
```

---

# SECTION 14

## Bug Fix

### Prompt

```txt
Fix bug.

Requirements:

1. Identify root cause
2. Explain issue
3. Provide fix
4. Minimize code changes
5. Avoid architecture violations

Return:

Root Cause
Files Changed
Solution
```

---

# SECTION 15

## Refactor Module

### Prompt

```txt
Refactor module.

Requirements:

- No behavior changes
- Improve readability
- Remove duplication
- Follow SOLID
- Follow Coding Standards

Return:

Issues Found
Proposed Changes
Updated Structure
```

---

# SECTION 16

## Security Review

### Prompt

```txt
Review module for security issues.

Check:

- Authentication
- Authorization
- Data Exposure
- Input Validation
- Logging
- Sensitive Information

Return:

Risk Level
Issue List
Recommended Fixes
```

---

# SECTION 17

## Architecture Review

### Prompt

```txt
Review implementation against:

- Clean Architecture
- Coding Standards
- Folder Structure

Check:

- Layer violations
- Dependency violations
- Naming violations

Return:

Pass/Fail
Findings
Recommended Fixes
```

---

# SECTION 18

## Database Review

### Prompt

```txt
Review database design.

Validate:

- INT Identity keys
- No foreign keys
- Common audit columns
- Naming conventions
- Scaffold compatibility

Return:

Pass/Fail
Issues
Recommendations
```

---

# SECTION 19

## Pre-Commit Review

### Prompt

```txt
Perform pre-commit review.

Validate:

- Build success
- Folder structure
- Coding standards
- Security
- Logging
- Validation

Return:

Checklist
Issues
Approval Status
```

---

# SECTION 20

## End-To-End Review

### Prompt

```txt
Review completed feature.

Validate complete workflow:

Admin:
- Login
- Create Question
- Create Exam
- Assign Exam

Student:
- Login
- Learn Material
- Take Exam
- View Result
- Download Certificate

Verify:

- UI
- API
- Database
- Security

Return:

Pass/Fail
Issues
Recommendations
```

---

# AI Execution Rules

Before every task:

1. Read relevant documents.
2. Verify dependencies.
3. Verify module status.
4. Follow architecture.
5. Follow coding standards.

Never:

* Invent architecture
* Skip validation
* Skip logging
* Skip authorization
* Create hard foreign keys
* Use Guid as default key

Always:

* Use INT Identity
* Use Scaffold-DbContext
* Use logical joins
* Respect API contract
* Respect folder structure

If requirements conflict:

```txt
PROJECT_VISION
    ↓
CODING_STANDARDS
    ↓
DATABASE_DESIGN
    ↓
FOLDER_STRUCTURE
    ↓
TASK_PROMPT
```

Higher priority document wins.
