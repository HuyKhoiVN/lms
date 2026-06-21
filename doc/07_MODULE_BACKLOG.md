# 07_MODULE_BACKLOG.md

# Module Backlog & Development Roadmap

## Purpose

This document defines:

* Module implementation order
* Dependencies
* Priorities
* Deliverables
* Definition of Ready
* Definition of Done

All AI agents must follow this implementation order.

Do not skip dependencies.

---

# Development Strategy

The project follows:

```txt id="1fjlwm"
UI First
→ API Contract
→ Database
→ Backend
→ Integration
```

Never start backend implementation before UI and API contract are approved.

---

# Release Plan

## Phase 1

Foundation

## Phase 2

Learning Management

## Phase 3

Question Bank

## Phase 4

Exam Management

## Phase 5

Exam Engine

## Phase 6

Reporting & Audit

---

# MODULE 01

## Foundation

Priority

```txt id="f7g25s"
Critical
```

Dependencies

```txt id="rn5klf"
None
```

Tasks

### Solution Setup

* Create solution
* Create projects
* Configure architecture

### UI Layout

* Sidebar
* Header
* Footer
* Base Layout

### Database Setup

* Create database
* Configure connection string
* Scaffold DbContext

### API Setup

* Swagger
* Dependency Injection
* Global Exception Middleware

Deliverables

```txt id="mb9q76"
Working Solution
Base Layout
Database Connection
Swagger
```

---

# MODULE 02

## Authentication

Priority

```txt id="a77xgm"
Critical
```

Dependencies

```txt id="98gnyv"
Foundation
```

UI Tasks

* Login Page
* Change Password Page

API Tasks

* Login
* Logout
* Refresh Token
* Change Password

Database Tables

```txt id="7ixikn"
Users
Roles
UserRoles
RefreshTokens
```

Done When

* User can login
* JWT generated
* Protected APIs work

---

# MODULE 03

## User Management

Priority

```txt id="m4ky40"
Critical
```

Dependencies

```txt id="97xjrh"
Authentication
```

UI Tasks

* User List
* Create User
* Edit User
* Lock User

API Tasks

* CRUD User
* Reset Password

Database Tables

```txt id="cndq8n"
Users
```

Done When

* Admin can manage users

---

# MODULE 04

## Group Management

Priority

```txt id="mlsnlb"
High
```

Dependencies

```txt id="q06x8w"
User Management
```

UI Tasks

* Group List
* Group Detail

API Tasks

* CRUD Group
* Add User
* Remove User

Database Tables

```txt id="jh1mxy"
Groups
GroupUsers
```

Done When

* Groups can be managed

---

# MODULE 05

## Course Management

Priority

```txt id="jlwmxw"
High
```

Dependencies

```txt id="njkrje"
User Management
```

UI Tasks

* Course List
* Course Detail

API Tasks

* CRUD Course
* Assign Course

Database Tables

```txt id="krnzzi"
Courses
CourseAssignments
```

Done When

* Courses can be assigned

---

# MODULE 06

## Learning Materials

Priority

```txt id="hfjr4r"
High
```

Dependencies

```txt id="vxm3yx"
Course Management
```

UI Tasks

* Material List
* Material Viewer

API Tasks

* CRUD Material
* Learning Progress

Database Tables

```txt id="4ygw6d"
LearningMaterials
LearningProgress
```

Done When

* User can learn materials

---

# MODULE 07

## Question Bank

Priority

```txt id="7rrw5w"
Critical
```

Dependencies

```txt id="y6cwgj"
Foundation
```

UI Tasks

* Question List
* Question Editor

API Tasks

* CRUD Question
* CRUD Category

Database Tables

```txt id="22hf6w"
QuestionCategories
Questions
AnswerOptions
```

Done When

* Questions can be managed

---

# MODULE 08

## Exam Management

Priority

```txt id="vx55i6"
Critical
```

Dependencies

```txt id="vtv4k6"
Question Bank
```

UI Tasks

* Exam List
* Exam Builder
* Exam Assignment

API Tasks

* CRUD Exam
* Publish Exam
* Assign Exam

Database Tables

```txt id="u8wb79"
Exams
ExamQuestions
ExamRandomRules
ExamAssignments
```

Done When

* Exams can be created

---

# MODULE 09

## Exam Engine

Priority

```txt id="8e6xq0"
Critical
```

Dependencies

```txt id="mr7psl"
Exam Management
```

UI Tasks

* Start Exam
* Exam Taking Screen
* Question Navigator
* Timer

API Tasks

* Start Attempt
* Autosave
* Submit

Database Tables

```txt id="8rdqtp"
ExamAttempts
AttemptQuestionSnapshots
AttemptAnswerSnapshots
AttemptAnswers
```

Critical Features

```txt id="rjbn2s"
Snapshot
Autosave
Auto Submit
```

Done When

* User can complete exam

---

# MODULE 10

## Scoring

Priority

```txt id="c44ytm"
Critical
```

Dependencies

```txt id="v9y5fz"
Exam Engine
```

API Tasks

* Score Calculation
* Pass Evaluation

Rules

```txt id="e00xig"
Single Choice
Multiple Choice
Pass Score
```

Done When

* Automatic scoring works

---

# MODULE 11

## Results

Priority

```txt id="lsifxk"
Critical
```

Dependencies

```txt id="65kzvx"
Scoring
```

UI Tasks

* Result List
* Result Detail

API Tasks

* Get Results
* Review Attempt

Database Tables

```txt id="u73iw9"
ExamResults
```

Done When

* Results are visible

---

# MODULE 12

## Certificates

Priority

```txt id="16a7np"
Medium
```

Dependencies

```txt id="5h1rm5"
Results
```

UI Tasks

* Certificate List

API Tasks

* Generate PDF
* Download PDF

Database Tables

```txt id="d9cbnn"
Certificates
```

Done When

* Certificates generated

---

# MODULE 13

## Reporting

Priority

```txt id="9kg1zd"
Medium
```

Dependencies

```txt id="t4khq5"
Results
```

UI Tasks

* Dashboard Reports
* Export Reports

API Tasks

* Summary Reports
* Excel Export
* PDF Export

Done When

* Reports generated

---

# MODULE 14

## Audit Logs

Priority

```txt id="8g8u0x"
High
```

Dependencies

```txt id="mjlwmh"
Authentication
```

UI Tasks

* Audit Viewer

API Tasks

* Query Logs

Database Tables

```txt id="s1ylu7"
AuditLogs
```

Done When

* All critical actions logged

---

# Integration Phase

Priority

```txt id="1suxio"
Critical
```

Dependencies

```txt id="o4c0zq"
All Modules
```

Tasks

* Replace Mock API
* Connect Real API
* Validate Contracts

Done When

* End-to-End Flow Works

---

# Testing Phase

Tasks

## Authentication

* Login
* Logout

## Learning

* View Materials
* Progress Tracking

## Exams

* Start Exam
* Autosave
* Submit
* Scoring

## Reporting

* Generate Reports

Done When

All business flows pass.

---

# AI Task Execution Rules

Before implementation:

1. Check dependencies.

2. Verify previous module completed.

3. Verify API contract exists.

4. Verify database table exists.

Do not start:

```txt id="g7htl6"
Exam Engine
```

before:

```txt id="z8iyt4"
Exam Management
```

is completed.

---

# MVP Completion Criteria

The MVP is complete when:

* Users can login
* Courses can be assigned
* Learning materials can be consumed
* Questions can be managed
* Exams can be created
* Exams can be taken
* Scores can be calculated
* Results can be reviewed
* Reports can be generated
* Audit logs are recorded

without manual database intervention.
