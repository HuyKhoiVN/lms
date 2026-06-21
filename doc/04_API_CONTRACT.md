# 04_API_CONTRACT.md

# API Contract Specification

## Purpose

This document defines all public APIs exposed by lms.Api.

The API contract is the agreement between:

* lms.WebMvc
* lms.Api

Frontend development and backend development must follow this contract.

Any breaking change requires approval.

---

# General API Rules

## Base URL

Development

```txt
https://localhost:7001/api
```

Production

```txt
https://api.domain.com/api
```

---

## Response Structure

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

## Authentication

JWT Bearer Token

Header

```http
Authorization: Bearer {token}
```

---

# MODULE: AUTHENTICATION

## Login

POST

```http
/api/auth/login
```

Request

```json
{
  "username": "admin",
  "password": "123456"
}
```

Response

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "user": {
      "id": "guid",
      "userName": "admin",
      "fullName": "Administrator",
      "role": "Admin"
    }
  }
}
```

---

## Refresh Token

POST

```http
/api/auth/refresh-token
```

Request

```json
{
  "refreshToken": "token"
}
```

---

## Logout

POST

```http
/api/auth/logout
```

---

## Change Password

POST

```http
/api/auth/change-password
```

Request

```json
{
  "oldPassword": "old",
  "newPassword": "new"
}
```

---

# MODULE: USERS

## Get Users

GET

```http
/api/users
```

Query

```http
?page=1&pageSize=20
```

Response

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 100
  }
}
```

---

## Create User

POST

```http
/api/users
```

Request

```json
{
  "userName": "student01",
  "fullName": "Student One",
  "email": "student@test.com",
  "role": "Student"
}
```

---

## Update User

PUT

```http
/api/users/{id}
```

---

## Lock User

POST

```http
/api/users/{id}/lock
```

---

## Unlock User

POST

```http
/api/users/{id}/unlock
```

---

## Reset Password

POST

```http
/api/users/{id}/reset-password
```

---

# MODULE: GROUPS

## Get Groups

GET

```http
/api/groups
```

---

## Create Group

POST

```http
/api/groups
```

Request

```json
{
  "name": "Sales Team"
}
```

---

## Add User To Group

POST

```http
/api/groups/{groupId}/users
```

Request

```json
{
  "userId": "guid"
}
```

---

## Remove User From Group

DELETE

```http
/api/groups/{groupId}/users/{userId}
```

---

# MODULE: COURSES

## Get Courses

GET

```http
/api/courses
```

---

## Create Course

POST

```http
/api/courses
```

Request

```json
{
  "name": "Safety Training",
  "description": "Basic safety course"
}
```

---

## Update Course

PUT

```http
/api/courses/{id}
```

---

## Assign Course

POST

```http
/api/courses/{id}/assign
```

Request

```json
{
  "userIds": [],
  "groupIds": []
}
```

---

# MODULE: LEARNING MATERIALS

## Get Materials

GET

```http
/api/learning-materials
```

---

## Create Material

POST

```http
/api/learning-materials
```

Request

```json
{
  "courseId": "guid",
  "title": "Introduction",
  "contentType": "Pdf",
  "fileUrl": ""
}
```

---

## Update Progress

POST

```http
/api/learning-progress
```

Request

```json
{
  "materialId": "guid"
}
```

---

# MODULE: QUESTION BANK

## Get Questions

GET

```http
/api/questions
```

Query

```http
?keyword=
&categoryId=
&difficulty=
```

---

## Create Question

POST

```http
/api/questions
```

Request

```json
{
  "content": "What is .NET?",
  "categoryId": "guid",
  "difficulty": "Easy",
  "score": 1,
  "questionType": "SingleChoice",
  "answers": [
    {
      "content": ".NET",
      "isCorrect": true
    }
  ]
}
```

---

## Update Question

PUT

```http
/api/questions/{id}
```

---

## Delete Question

DELETE

```http
/api/questions/{id}
```

---

# MODULE: EXAMS

## Get Exams

GET

```http
/api/exams
```

---

## Create Exam

POST

```http
/api/exams
```

Request

```json
{
  "name": "Safety Exam",
  "durationMinutes": 60,
  "passScore": 80,
  "reviewMode": "FULL_REVIEW"
}
```

---

## Publish Exam

POST

```http
/api/exams/{id}/publish
```

---

## Assign Exam

POST

```http
/api/exams/{id}/assign
```

Request

```json
{
  "userIds": [],
  "groupIds": []
}
```

---

# MODULE: EXAM ATTEMPTS

## Start Exam

POST

```http
/api/exam-attempts/start
```

Request

```json
{
  "examId": "guid"
}
```

Response

```json
{
  "success": true,
  "data": {
    "attemptId": "guid",
    "startedAt": "datetime",
    "durationMinutes": 60,
    "questions": []
  }
}
```

---

## Autosave Answers

POST

```http
/api/exam-attempts/{attemptId}/autosave
```

Request

```json
{
  "answers": []
}
```

---

## Submit Exam

POST

```http
/api/exam-attempts/{attemptId}/submit
```

Request

```json
{
  "answers": []
}
```

Response

```json
{
  "success": true,
  "data": {
    "resultId": "guid",
    "score": 85,
    "passed": true
  }
}
```

---

# MODULE: RESULTS

## My Results

GET

```http
/api/results/my
```

---

## Result Detail

GET

```http
/api/results/{id}
```

---

## Review Attempt

GET

```http
/api/results/{id}/review
```

---

# MODULE: CERTIFICATES

## Get Certificates

GET

```http
/api/certificates
```

---

## Download Certificate

GET

```http
/api/certificates/{id}/download
```

---

# MODULE: REPORTS

## Exam Summary Report

GET

```http
/api/reports/exam-summary
```

---

## Pass Rate Report

GET

```http
/api/reports/pass-rate
```

---

## Question Analysis Report

GET

```http
/api/reports/question-analysis
```

---

## Export Excel

GET

```http
/api/reports/export/excel
```

---

## Export PDF

GET

```http
/api/reports/export/pdf
```

---

# MODULE: AUDIT LOGS

## Get Audit Logs

GET

```http
/api/audit-logs
```

Query

```http
?page=1
&pageSize=50
&userId=
&action=
&fromDate=
&toDate=
```

---

# Security Rules

Never expose:

* Correct answers
* Internal scoring rules
* Audit internals

before exam submission.

---

# Versioning Strategy

Current Version

```txt
v1
```

Example

```http
/api/v1/exams
```

Future versions must not break existing contracts.
