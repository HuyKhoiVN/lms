# Backend Module Overview

## 1. Muc tieu

Thiet ke Backend theo module doc lap theo Domain, moi module co entity, service, repository, API, DTO, business rule, security, logging, exception va thu tu implement ro rang.

Backend phai du de lap trinh vien implement ma khong can phan tich lai yeu cau.

## 2. Backend architecture

Luon di theo flow:

```txt
Client
  -> Controller
  -> Application Service
  -> Repository Interface
  -> Repository Implementation
  -> LmsDbContext
  -> SQL Server
```

Layer responsibility:

| Layer | Trach nhiem |
| --- | --- |
| `lms.Api` | REST controller, auth filter, request/response boundary |
| `lms.Application` | Use case, service contract, DTO, validation, business orchestration |
| `lms.Domain` | Entity, enum, domain concept |
| `lms.Persistence` | EF Core DbContext, configuration, migration, repository implementation |
| `lms.Infrastructure` | JWT, password hash, file storage, PDF, export, email |
| `lms.WebMvc` | UI only, goi API qua HTTP/AJAX |

## 3. Module map

| No | Module | Vai tro | Actor chinh |
| --- | --- | --- | --- |
| 01 | Identity | Dang nhap, token, doi mat khau | Anonymous, Admin, Student |
| 02 | User Management | Quan ly tai khoan | Admin |
| 03 | Group Management | Quan ly nhom hoc vien | Admin |
| 04 | Course Management | Quan ly khoa hoc va gan khoa hoc | Admin, Student |
| 05 | Learning Material | Quan ly hoc lieu | Admin, Student |
| 06 | Learning Progress | Theo doi tien do hoc | Student, Admin |
| 07 | Question Bank | Quan ly cau hoi/dap an | Admin |
| 08 | Exam Management | Tao/cau hinh/publish bai thi | Admin |
| 09 | Exam Assignment | Gan bai thi cho user/group/course | Admin |
| 10 | Exam Engine | Start/autosave/submit bai thi | Student, System |
| 11 | Scoring | Cham diem tu dong | System, Admin |
| 12 | Result & History | Lich su diem va review | Student, Admin |
| 13 | Certificate | Cap va tai chung nhan | Student, Admin, System |
| 14 | Reporting | Bao cao va export | Admin |
| 15 | Audit Logging | Truy vet thao tac | Admin, System |
| 16 | File Management | Quan ly metadata file | Admin, Student, System |

## 4. Dependency giua module

```txt
Identity
  -> User Management

User Management
  -> Group Management
  -> Course Management
  -> Exam Assignment

Group Management
  -> Course Management
  -> Exam Assignment

Course Management
  -> Learning Material
  -> Learning Progress
  -> Exam Assignment

Question Bank
  -> Exam Management

Exam Management
  -> Exam Assignment
  -> Exam Engine

Exam Engine
  -> Scoring
  -> Result & History

Result & History
  -> Certificate
  -> Reporting

Audit Logging
  -> all modules

File Management
  -> Learning Material
  -> Certificate
  -> Reporting
```

## 5. Development order tong the

| Phase | Module | Ly do |
| --- | --- | --- |
| 1 | Identity, User Management, Audit Logging base | Nen tang auth, actor, audit |
| 2 | Group Management, Course Management | Nen tang gan hoc vien/khoa hoc |
| 3 | Learning Material, Learning Progress, File Management base | Nen tang hoc lieu va tien do |
| 4 | Question Bank | Nen tang cau hoi |
| 5 | Exam Management, Exam Assignment | Cau hinh va phan phoi bai thi |
| 6 | Exam Engine | Luong thi critical |
| 7 | Scoring, Result & History | Cham diem va lich su |
| 8 | Certificate | Sinh chung nhan sau pass |
| 9 | Reporting, export, audit query | Bao cao va van hanh |

## 6. Cross-cutting rules

### 6.1 Database relationship

Khong module nao duoc yeu cau database FK. Quan he chi la logic:

```txt
Users.Id = ExamAttempts.UserId
Exams.Id = ExamAttempts.ExamId
Questions.Id = AnswerOptions.QuestionId
ExamAttempts.Id = AttemptAnswers.AttemptId
```

Service phai validate record ton tai va permission truoc khi ghi.

### 6.2 Soft delete

Master data uu tien soft delete:

- `Users`
- `Groups`
- `Courses`
- `LearningMaterials`
- `QuestionCategories`
- `Questions`
- `AnswerOptions`
- `Exams`

Transaction/history data khong xoa trong workflow binh thuong:

- `ExamAttempts`
- `AttemptQuestionSnapshots`
- `AttemptAnswerSnapshots`
- `AttemptAnswers`
- `ExamResults`
- `Certificates`
- `AuditLogs`

### 6.3 Validation

Validation chia 3 cap:

- Request validation: required, length, format, enum value.
- Business validation: duplicate, state, permission, ownership.
- Data validation: logical Id ton tai, `IsDelete = false`, status phu hop.

### 6.4 Error model

Moi service nen tra loi loi nghiep vu theo nhom:

- `ValidationException`
- `NotFoundException`
- `ForbiddenException`
- `ConflictException`
- `BusinessRuleException`

Controller map sang HTTP status code tuong ung.

### 6.5 Pagination and filter

List API phai ho tro toi thieu:

```txt
page
pageSize
keyword
status
sortBy
sortDirection
```

Module co filter rieng duoc bo sung them, vi du `courseId`, `examId`, `difficulty`, `fromDate`, `toDate`.

## 7. Shared DTO conventions

Shared DTO nen co:

- `PagedResult<T>`
- `ApiResponse<T>`
- `ErrorResponse`
- `LookupItemResponse`
- `IdNameResponse`

Tat ca DTO public khong expose:

- `PasswordHash`
- `IsCorrect` truoc khi submit/review hop le
- Token internals
- Audit `BeforeData`/`AfterData` neu user khong du quyen

