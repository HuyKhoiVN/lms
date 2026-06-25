# Backend Module Design

## Muc dich

Thu muc nay la bo tai lieu thiet ke Backend theo module nghiep vu cho du an `lms`.

Tai lieu nay dung cho giai doan chuan bi implement Backend, chua yeu cau viet business logic hoac source code chi tiet.

## Cong nghe va kien truc

Backend duoc trien khai theo dinh huong:

- ASP.NET Core Web API
- Clean Architecture
- Entity Framework Core Code First
- SQL Server
- EF Core Migration
- JWT Bearer Authentication
- RESTful API

Database duoc sinh tu C# entity va EF Core configuration thong qua migration. Khong tao database thu cong truoc, khong dung Database First, khong dung Scaffold-DbContext.

## Thu tu doc tai lieu

1. `README.md`
   - Tong quan va quy tac chung.

2. `01_BACKEND_MODULE_OVERVIEW.md`
   - Ban do module, dependency, thu tu phat trien tong the.

3. `02_MODULE_DESIGN_SPEC.md`
   - Thiet ke chi tiet tung module.

4. `03_IMPLEMENTATION_ROADMAP.md`
   - Roadmap implement, checklist va test plan.

## Dependency rules

Phai tuan thu dependency direction:

```txt
lms.Api
  -> lms.Application
  -> lms.Persistence
  -> lms.Infrastructure

lms.Application
  -> lms.Domain

lms.Persistence
  -> lms.Application
  -> lms.Domain

lms.Infrastructure
  -> lms.Application
  -> lms.Domain

lms.Domain
  -> no project dependency
```

Khong duoc:

- `lms.Domain` reference project khac.
- `lms.Application` reference `lms.Persistence`.
- `lms.WebMvc` reference backend projects.
- Dat business logic trong controller.
- Dat EF Core hoac `DbContext` trong `lms.Api` controller.

## Database rules

Database phai tuan thu `doc/16_DATABASE_CODE_FIRST_GUIDE`.

Bat buoc:

- SQL Server.
- EF Core Code First.
- Migration trong `lms.Persistence`.
- Connection string lay tu `lms.Api/appsettings.json`, key `ConnectionStrings:LmsDb`.
- Entity nam trong `lms.Domain`.
- DbContext nam trong `lms.Persistence`.
- Configuration tach rieng tung entity.

Khong duoc:

- Khong dung Foreign Key Constraint trong database.
- Khong dung navigation property lam EF sinh FK.
- Khong dung `HasOne`, `HasMany`, `HasForeignKey`, `OnDelete`.
- Khong dung cascade delete o database.
- Khong hardcode connection string.

Quan he giua bang chi la logic qua scalar Id:

```txt
UserId
RoleId
GroupId
CourseId
MaterialId
QuestionId
ExamId
AttemptId
ResultId
CertificateId
FileRecordId
```

Service layer phai kiem tra tinh hop le cua cac Id nay truoc khi ghi du lieu.

## Naming conventions

### Entity

Entity dung so it, PascalCase:

```txt
User
Course
LearningMaterial
Question
ExamAttempt
```

### Table

Table dung so nhieu, PascalCase:

```txt
Users
Courses
LearningMaterials
Questions
ExamAttempts
```

### DTO

DTO dung pattern:

```txt
CreateXRequest
UpdateXRequest
XDetailResponse
XListItemResponse
SearchXRequest
XFilterRequest
PagedResult<T>
```

### Service

Service interface dung:

```txt
IUserService
ICourseService
IExamService
```

### Repository

Repository interface dung:

```txt
IUserRepository
ICourseRepository
IExamRepository
```

## REST response standard

Success:

```json
{
  "success": true,
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

## Authentication and authorization

Authentication:

```http
Authorization: Bearer {accessToken}
```

Roles:

- `Admin`
- `Student`
- `System`

Admin-only endpoints phai kiem tra role `Admin`.

Student endpoints phai kiem tra owner/access rule, vi du user chi duoc xem result, certificate, attempt cua chinh minh.

## Common HTTP status codes

- `200 OK`: get/update/action thanh cong.
- `201 Created`: tao moi thanh cong.
- `204 No Content`: delete/remove thanh cong va khong can body.
- `400 Bad Request`: request sai format hoac validation fail.
- `401 Unauthorized`: chua dang nhap hoac token khong hop le.
- `403 Forbidden`: khong du quyen.
- `404 Not Found`: khong tim thay resource.
- `409 Conflict`: duplicate, state conflict, rule conflict.
- `422 Unprocessable Entity`: request hop le ve format nhung vi pham nghiep vu.

## Audit logging chung

Phai ghi audit log cho:

- Login
- Logout
- Create
- Update
- Delete / Soft delete
- Lock / Unlock
- Reset password
- Assign / Remove assignment
- Publish / Unpublish
- Start exam
- Autosave exam
- Submit exam
- Generate certificate
- Download/export report

`AuditLogs` la append-only.

## Ghi chu thiet ke hien tai

Tai lieu nay khong thay the `doc/04_API_CONTRACT.md`; no mo rong va lam ro thiet ke Backend theo module.

`doc/05_DATABASE_DESIGN.md` la huong cu Database First. Voi Backend hien tai, uu tien `doc/16_DATABASE_CODE_FIRST_GUIDE`.

Can xu ly cac gap da review truoc khi implement production:

- `IsDelete` nen co default constraint `0`.
- Can chot bang nao bat buoc audit fields, bang nao duoc mien.
- `RefreshTokens.Token` nen unique.
- Unique index can xem xet soft delete filter neu cho phep tai su dung key sau khi xoa mem.

