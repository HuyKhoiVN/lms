# AI Development Workflow - lms

## Project Overview

Project Name: lms

Type:
Learning Management System + Online Examination System

Technology Stack:

* .NET 9
* ASP.NET Core Web API
* ASP.NET MVC (UI only)
* SQL Server
* EF Core
* Clean Architecture
* HTML
* CSS
* jQuery

---

# Architecture Principles

The system is separated into:

## Backend

* lms.Domain
* lms.Application
* lms.Persistence
* lms.Infrastructure
* lms.Api

## Frontend

* lms.WebMvc

Frontend and Backend are independent.

lms.WebMvc MUST NOT reference:

* lms.Domain
* lms.Application
* lms.Persistence
* lms.Infrastructure

Communication is only through REST APIs.

---

# Development Strategy

The project is developed in 3 major phases.

## Phase 1 — UI First

Goal:

Build complete UI before backend implementation.

Requirements:

* Use HTML
* Use CSS
* Use jQuery
* Use AJAX
* Use mock JSON files

Do NOT:

* Connect database
* Create EF Core entities
* Create backend business logic

UI should simulate all business flows using mock data.

---

## Phase 2 — API Contract

Goal:

Freeze all API contracts before backend implementation.

Create:

docs/api-contract.md

Each endpoint must contain:

* HTTP Method
* URL
* Request Body
* Response Body
* Validation Rules
* Authorization Rules

No backend implementation until API contract is approved.

---

## Phase 3 — Backend Implementation

Build backend according to approved API contract.

Order:

1. Domain
2. Persistence
3. Application
4. Infrastructure
5. Api

Never implement API before domain model exists.

---

# UI Design Rules

The provided Figma is used as:

Design System
Component Library
Visual Reference

The business workflow must be transformed from:

Learning Platform

to

Learning + Examination Platform

Keep:

* Typography
* Colors
* Sidebar
* Cards
* Tables
* Forms
* Layout System

Modify:

* Navigation
* Business Screens
* User Flow

---

# UI Modules

## Authentication

* Login
* Change Password

## Dashboard

Admin Dashboard
Student Dashboard

## User Management

* User List
* Create User
* Edit User
* Lock User

## Group Management

* Group List
* Group Detail

## Course Management

* Course List
* Course Detail

## Learning Materials

* Material List
* Material Detail

## Question Bank

* Question List
* Create Question
* Edit Question

## Exam Management

* Exam List
* Exam Builder
* Exam Assignment

## Examination

* Start Exam
* Exam Taking
* Submit Exam

## Results

* Result List
* Result Detail

## Reports

* Pass Rate
* Score Distribution
* User Statistics

## Audit Logs

* Activity Log

---

# Backend Modules

## Identity

Authentication
Authorization

## Users

User management

## Groups

Group management

## Courses

Course management

## LearningMaterials

Learning content

## QuestionBank

Question management

## Exams

Exam configuration

## ExamAttempts

Exam runtime

## Scoring

Automatic scoring

## Results

Exam results

## Certificates

Certificate generation

## Reports

Statistics and exports

## AuditLogs

Audit trail

---

# Important Business Rules

1. User must login.

2. Only Admin can create users.

3. Course exam requires completed learning materials.

4. Standalone exam does not require completion.

5. Multiple choice:
   full correct answer only.

6. Auto submit when timer expires.

7. Snapshot exam at start.

8. Prevent duplicate submission.

9. Autosave every 15-30 seconds.

10. Certificate only after PASS.

---

# Screen Development Order

Phase 1 UI Order:

1. Login
2. Layout
3. Dashboard
4. User Management
5. Course Management
6. Question Bank
7. Exam Management
8. Exam Taking
9. Results
10. Reports

Do not jump to backend before all UI screens are approved.

---

# AI Task Rules

Before writing code:

1. Explain the approach.
2. List files to create.
3. List files to modify.
4. Wait for confirmation if architecture changes are required.

When implementing:

1. Keep changes small.
2. Follow existing structure.
3. Reuse components.
4. Avoid duplication.

After implementation:

1. Build successfully.
2. Verify no broken references.
3. Verify navigation works.
4. Verify coding standards.

---

# Exam Screen Requirements

The exam screen is critical.

Must support:

* Countdown timer
* Question navigator
* Previous/Next question
* Single choice
* Multiple choice
* Autosave
* Submit confirmation
* Auto submit

Must NOT:

* Expose correct answers before submit

---

# Future Enhancements

Not included in MVP:

* Mobile App
* AI Proctoring
* Webcam Monitoring
* Anti-Cheat Detection
* Live Streaming
* Adaptive Learning

These must not affect current architecture.
