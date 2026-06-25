# Backend Implementation Roadmap

## 1. Muc tieu

Tai lieu nay dinh nghia thu tu implement Backend sau khi thiet ke module duoc chap nhan.

Chua implement trong giai doan lap tai lieu. Khi bat dau code, moi module phai di theo cung mot pipeline de tranh lech kien truc.

## 2. Implementation pipeline cho moi module

Moi module implement theo thu tu:

```txt
1. Entity review
2. EF Core configuration review
3. Migration review
4. Repository interface
5. Repository implementation
6. Service interface
7. Service implementation
8. Validator
9. DTO
10. Controller
11. Unit test
12. Integration test
13. Audit log verification
14. Security verification
```

Khong viet controller truoc khi service contract va DTO ro rang.

## 3. Phase roadmap

### Phase 1 - Foundation

Module:

- Identity
- User Management
- Audit Logging base

Deliverables:

- Auth service contract.
- User repository/service.
- JWT/password hash integration points.
- Audit service append-only contract.
- Migration health check: `sys.foreign_keys = 0`.

### Phase 2 - Organization and Learning Base

Module:

- Group Management
- Course Management
- File Management base

Deliverables:

- Group CRUD and membership.
- Course CRUD and assignments.
- File metadata contract.
- Service validation for `UserId`, `GroupId`, `CourseId`.

### Phase 3 - Learning Content

Module:

- Learning Material
- Learning Progress

Deliverables:

- Material CRUD.
- Student material listing.
- Progress update.
- Course progress summary.

### Phase 4 - Question Bank

Module:

- Question Bank

Deliverables:

- Category CRUD.
- Question CRUD.
- Answer option management.
- Single/multiple choice validation.

### Phase 5 - Exam Setup

Module:

- Exam Management
- Exam Assignment

Deliverables:

- Exam CRUD.
- Manual question assignment.
- Random rule configuration.
- Publish/unpublish.
- User/group/course assignment.

### Phase 6 - Exam Runtime

Module:

- Exam Engine

Deliverables:

- Start attempt.
- Snapshot generation.
- Autosave answers.
- Submit idempotency.
- Attempt event logging.

### Phase 7 - Score and Result

Module:

- Scoring
- Result & History

Deliverables:

- Single choice scoring.
- Multiple choice scoring.
- Pass/fail calculation.
- Result list/detail/review.
- Review mode enforcement.

### Phase 8 - Certificate and Reporting

Module:

- Certificate
- Reporting
- Audit query

Deliverables:

- Certificate generation.
- Certificate download.
- Report queries.
- Excel/PDF export contract.
- Audit log query endpoint.

## 4. Pre-code checklist

Truoc khi implement moi module:

- Doc `doc/17_BACKEND_MODULE_DESIGN/02_MODULE_DESIGN_SPEC.md`.
- Doi chieu `doc/04_API_CONTRACT.md`.
- Doi chieu `doc/16_DATABASE_CODE_FIRST_GUIDE`.
- Xac nhan entity da co hoac can bo sung.
- Xac nhan khong can FK constraint.
- Xac nhan DTO naming.
- Xac nhan role/permission.
- Xac nhan audit actions.
- Xac nhan test scenario.

## 5. Migration checklist

Moi migration phai pass:

```bash
rg -n "ForeignKey|AddForeignKey|ReferentialAction|onDelete|HasOne|HasMany|HasForeignKey|OnDelete" src/lms/lms.Persistence
```

Ket qua mong muon:

```txt
No matches
```

Sau khi update database:

```sql
SELECT COUNT(*) AS ForeignKeyCount
FROM sys.foreign_keys;
```

Ket qua mong muon:

```txt
0
```

## 6. Unit test plan

### Identity

- Login fail khi sai password.
- Login fail khi user locked.
- Refresh token fail khi revoked/expired.
- Change password fail khi old password sai.

### User, Group, Course

- Duplicate username bi chan.
- Lock user khong xoa user.
- Add duplicate user to group bi chan.
- Assign duplicate course bi chan.
- Delete course co progress/attempt bi chan.

### Learning

- Student chi xem material duoc assign.
- Update progress khong vuot 100%.
- Course completion tinh dung.

### Question Bank

- Single choice phai co dung 1 correct answer.
- Multiple choice phai co it nhat 1 correct answer.
- Delete question da nam trong published exam bi chan hoac chi soft delete theo rule.

### Exam

- Publish exam fail khi thieu question.
- Assign exam fail khi exam chua publish neu rule yeu cau.
- Start exam fail khi vuot attempt limit.
- Snapshot duoc tao day du.
- Submit lan 2 tra result cu.

### Result, Certificate, Reporting

- Result score dung voi snapshot.
- Review ton trong `ReviewMode`.
- Certificate chi generate khi pass.
- Report filter theo date/course/exam dung.

## 7. Integration test plan

Luon co integration test cho luong end-to-end:

1. Admin login.
2. Admin tao user student.
3. Admin tao group/course/material.
4. Admin tao question bank.
5. Admin tao exam va publish.
6. Admin assign exam cho student/group.
7. Student login.
8. Student start exam.
9. Student autosave.
10. Student submit.
11. System score va tao result.
12. Student xem result.
13. Certificate duoc generate neu pass.
14. Admin xem report.
15. Audit logs co du event quan trong.

## 8. Architecture test plan

Can co test/static check:

- `lms.Domain` khong reference project khac.
- `lms.Application` khong reference `lms.Persistence`.
- `lms.WebMvc` khong reference backend projects.
- Controller khong goi truc tiep `LmsDbContext`.
- Application service khong expose EF Core type.
- Entity khong co navigation property lam sinh FK.

## 9. Quality gates

Mot module chi duoc coi la done khi:

- Build pass.
- API contract match.
- Unit tests pass.
- Integration tests pass cho flow lien quan.
- Migration khong sinh FK.
- Audit actions da ghi.
- Authorization da kiem tra.
- Business exceptions duoc map dung status code.
- Khong expose sensitive data.

