# Module Design Specification

## 0. Template ap dung cho moi module

Moi module phai duoc implement theo cung mot contract:

- Tong quan: muc tieu, chuc nang, vai tro, actor.
- Entity: mo ta, vai tro, thuoc tinh chinh, quan he logic khong FK.
- Service Layer: interface/service va trach nhiem.
- Repository Layer: repository va entity quan ly.
- RESTful API: method, URL, muc dich, request DTO, response DTO, auth, authorization, validation, status code.
- Business Flow: `Client -> Controller -> Service -> Repository -> DbContext -> Database`.
- Business Rules.
- DTO.
- Security.
- Logging.
- Exception Handling.
- Dependency.
- Development Plan.

Quy tac bat buoc cho tat ca module:

- Khong dung database FK.
- Khong dung EF navigation property lam sinh FK.
- Moi quan he validate trong service.
- Controller mong, khong chua business logic.
- Response theo chuan `{ success, data/message/errors }`.
- Audit log cho thao tac quan trong.

---

# 1. Identity

## Tong quan

Muc tieu: xac thuc nguoi dung, cap JWT, quan ly refresh token, logout va doi mat khau.

Chuc nang:

- Login.
- Refresh access token.
- Logout/revoke token.
- Change password.

Vai tro trong he thong: cong vao bat buoc cho cac module duoc bao ve.

Actors:

- Anonymous: login, refresh token.
- Admin: login, change password, logout.
- Student: login, change password, logout.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `User` | Tai khoan nguoi dung | `Id`, `UserName`, `Email`, `PasswordHash`, `FullName`, `IsLocked`, `LastLoginDate`, audit fields | `Users.Id = UserRoles.UserId`, `Users.Id = RefreshTokens.UserId` |
| `Role` | Vai tro he thong | `Id`, `Name`, `Description`, audit fields | `Roles.Id = UserRoles.RoleId` |
| `UserRole` | Gan role cho user | `Id`, `UserId`, `RoleId` | Logic link toi `Users`, `Roles` |
| `RefreshToken` | Token lam moi access token | `Id`, `UserId`, `Token`, `Expires`, `Created`, `Revoked`, `ReplacedByToken` | Logic link toi `Users` |

## Service Layer

- `IAuthService`: login, refresh token, logout, change password.
- `ITokenService`: generate access token, generate refresh token, validate token claims.
- `IPasswordHasherService`: hash password, verify password.
- `ICurrentUserService`: doc current user id/role tu JWT claims.

## Repository Layer

- `IUserRepository`: truy van user theo id, username, email.
- `IRoleRepository`: truy van role cua user.
- `IRefreshTokenRepository`: tao, tim, revoke refresh token.

## RESTful API

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/login` | Dang nhap | `LoginRequest` | `LoginResponse` | None | Anonymous | username/password required | 200, 400, 401, 423 |
| POST | `/api/auth/refresh-token` | Lay access token moi | `RefreshTokenRequest` | `LoginResponse` | None | Token owner by refresh token | refreshToken required, active | 200, 400, 401 |
| POST | `/api/auth/logout` | Logout va revoke token | `LogoutRequest` | `ActionResponse` | JWT | Authenticated | refreshToken optional/valid | 200, 401 |
| POST | `/api/auth/change-password` | Doi mat khau | `ChangePasswordRequest` | `ActionResponse` | JWT | Authenticated | oldPassword correct, newPassword policy | 200, 400, 401, 422 |

## Business Flow

```txt
Client -> AuthController -> AuthService -> UserRepository/RefreshTokenRepository -> LmsDbContext -> SQL Server
```

## Business Rules

- User bi khoa khong duoc login.
- Password khong bao gio luu plaintext.
- Refresh token expired/revoked khong duoc dung.
- Logout phai revoke refresh token neu co.
- Change password phai verify old password.
- Login thanh cong cap access token va refresh token moi.

## DTO

- `LoginRequest`
- `LoginResponse`
- `RefreshTokenRequest`
- `LogoutRequest`
- `ChangePasswordRequest`
- `CurrentUserResponse`

## Security

- JWT Bearer.
- Password hash only.
- Refresh token nen unique va co expiry.
- Khong tra `PasswordHash`, token internals, revoked metadata cho UI.

## Logging

- Login success/fail.
- Logout.
- Refresh token.
- Change password.
- User locked login attempt.

## Exception

- `InvalidCredentialsException`
- `UserLockedException`
- `RefreshTokenInvalidException`
- `PasswordPolicyException`

## Dependency

- User Management.
- Audit Logging.
- Infrastructure authentication.

## Development Plan

`Entity -> Repository -> Service -> Token/Password infrastructure -> API -> Unit Test -> Integration Test`

---

# 2. User Management

## Tong quan

Muc tieu: quan ly tai khoan nguoi dung va role cua nguoi dung.

Chuc nang:

- Xem danh sach user.
- Tao/sua user.
- Khoa/mo khoa user.
- Reset password.
- Gan role.

Vai tro: nen tang actor cho tat ca module.

Actors:

- Admin.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `User` | Tai khoan | `Id`, `UserName`, `Email`, `FullName`, `IsLocked`, `LastLoginDate`, audit fields | Link logic toi assignment, attempt, result |
| `Role` | Vai tro | `Id`, `Name`, `Description` | Link logic qua `UserRoles.RoleId` |
| `UserRole` | Gan role | `Id`, `UserId`, `RoleId` | `UserId`, `RoleId` la logical Id |

## Service Layer

- `IUserService`: CRUD user, lock/unlock, reset password.
- `IUserRoleService`: gan/doi role user.

## Repository Layer

- `IUserRepository`: quan ly `User`.
- `IRoleRepository`: quan ly `Role`.
- `IUserRoleRepository`: quan ly `UserRole`.

## RESTful API

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/users` | Tim/list user | `UserFilterRequest` | `PagedResult<UserListItemResponse>` | JWT | Admin | page/pageSize valid | 200, 401, 403 |
| GET | `/api/users/{id}` | Chi tiet user | None | `UserDetailResponse` | JWT | Admin | id exists | 200, 401, 403, 404 |
| POST | `/api/users` | Tao user | `CreateUserRequest` | `UserDetailResponse` | JWT | Admin | username unique, role exists | 201, 400, 409 |
| PUT | `/api/users/{id}` | Sua user | `UpdateUserRequest` | `UserDetailResponse` | JWT | Admin | id exists, email format | 200, 400, 404, 409 |
| DELETE | `/api/users/{id}` | Soft delete user | None | None | JWT | Admin | cannot delete self, no active attempt | 204, 403, 404, 409 |
| POST | `/api/users/{id}/lock` | Khoa user | `LockUserRequest` | `ActionResponse` | JWT | Admin | id exists, not self if configured | 200, 404, 409 |
| POST | `/api/users/{id}/unlock` | Mo khoa user | None | `ActionResponse` | JWT | Admin | id exists | 200, 404 |
| POST | `/api/users/{id}/reset-password` | Reset mat khau | `ResetPasswordRequest` | `ActionResponse` | JWT | Admin | password policy | 200, 400, 404 |

## Business Flow

```txt
Client -> UsersController -> UserService -> UserRepository/UserRoleRepository -> LmsDbContext -> Database
```

## Business Rules

- `UserName` unique.
- Khong expose `PasswordHash`.
- Khong xoa vat ly user.
- Khong khoa/xoa system admin cuoi cung.
- Reset password phai audit.
- User bi `IsDelete = true` khong duoc login.

## DTO

- `CreateUserRequest`
- `UpdateUserRequest`
- `UserDetailResponse`
- `UserListItemResponse`
- `UserFilterRequest`
- `LockUserRequest`
- `ResetPasswordRequest`

## Security

- Admin only.
- Admin khong duoc thay doi password cua user neu khong qua reset password endpoint.

## Logging

- Create/update/delete user.
- Lock/unlock user.
- Reset password.
- Change role.

## Exception

- `UserNotFoundException`
- `DuplicateUserNameException`
- `DuplicateEmailException`
- `CannotDeleteUserException`
- `CannotLockLastAdminException`

## Dependency

- Identity.
- Audit Logging.

## Development Plan

`Entity -> Repository -> Service -> Validator -> API -> Unit Test -> Integration Test`

---

# 3. Group Management

## Tong quan

Muc tieu: quan ly nhom hoc vien de gan course/exam theo nhom.

Actors:

- Admin.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `Group` | Nhom hoc vien | `Id`, `Name`, `Description`, `Status`, audit fields | `Groups.Id = GroupUsers.GroupId` |
| `GroupUser` | Thanh vien nhom | `Id`, `GroupId`, `UserId` | Link logic toi `Groups`, `Users` |

## Service Layer

- `IGroupService`: CRUD group, search group.
- `IGroupMemberService`: add/remove/list members.

## Repository Layer

- `IGroupRepository`: quan ly `Group`.
- `IGroupUserRepository`: quan ly `GroupUser`.
- `IUserRepository`: validate `UserId`.

## RESTful API

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/groups` | List group | `GroupFilterRequest` | `PagedResult<GroupListItemResponse>` | JWT | Admin | page/pageSize valid | 200 |
| GET | `/api/groups/{id}` | Chi tiet group | None | `GroupDetailResponse` | JWT | Admin | id exists | 200, 404 |
| POST | `/api/groups` | Tao group | `CreateGroupRequest` | `GroupDetailResponse` | JWT | Admin | name required/unique | 201, 400, 409 |
| PUT | `/api/groups/{id}` | Sua group | `UpdateGroupRequest` | `GroupDetailResponse` | JWT | Admin | id exists | 200, 404, 409 |
| DELETE | `/api/groups/{id}` | Soft delete group | None | None | JWT | Admin | no active assignments or rule allows soft delete | 204, 404, 409 |
| GET | `/api/groups/{groupId}/users` | List member | `GroupMemberFilterRequest` | `PagedResult<GroupMemberResponse>` | JWT | Admin | group exists | 200, 404 |
| POST | `/api/groups/{groupId}/users` | Add member | `AddGroupUserRequest` | `ActionResponse` | JWT | Admin | group/user exists, not duplicate | 200, 400, 404, 409 |
| DELETE | `/api/groups/{groupId}/users/{userId}` | Remove member | None | None | JWT | Admin | relation exists | 204, 404 |

## Business Flow

```txt
Client -> GroupsController -> GroupService -> GroupRepository/GroupUserRepository -> LmsDbContext -> Database
```

## Business Rules

- Group name unique.
- Khong add user bi khoa/xoa vao group.
- Khong duplicate `GroupId + UserId`.
- Remove member khong xoa user.
- Deleting group khong xoa members/users vat ly.

## DTO

- `CreateGroupRequest`
- `UpdateGroupRequest`
- `GroupDetailResponse`
- `GroupListItemResponse`
- `GroupFilterRequest`
- `AddGroupUserRequest`
- `GroupMemberResponse`

## Security

- Admin only.

## Logging

- Create/update/delete group.
- Add/remove group member.

## Exception

- `GroupNotFoundException`
- `DuplicateGroupNameException`
- `GroupMemberAlreadyExistsException`
- `GroupMemberNotFoundException`

## Dependency

- User Management.
- Audit Logging.

## Development Plan

`Entity -> Repository -> Service -> API -> Unit Test -> Integration Test`

---

# 4. Course Management

## Tong quan

Muc tieu: quan ly khoa hoc va gan khoa hoc cho user/group.

Actors:

- Admin: CRUD/assign.
- Student: xem khoa hoc duoc assign.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `Course` | Khoa hoc | `Id`, `Code`, `Name`, `Description`, `Status`, `IsPublished`, audit fields | Link logic toi material/progress/assignment |
| `CourseAssignment` | Gan course cho user | `Id`, `CourseId`, `UserId` | Link logic toi `Courses`, `Users` |
| `GroupCourseAssignment` | Gan course cho group | `Id`, `GroupId`, `CourseId` | Link logic toi `Groups`, `Courses` |
| `CourseExam` | Gan exam vao course | `Id`, `CourseId`, `ExamId`, `Order` | Link logic toi `Courses`, `Exams` |

## Service Layer

- `ICourseService`: CRUD, publish/unpublish, query.
- `ICourseAssignmentService`: assign/remove user/group.
- `ICourseAccessService`: kiem tra student co quyen hoc course.

## Repository Layer

- `ICourseRepository`
- `ICourseAssignmentRepository`
- `IGroupCourseAssignmentRepository`
- `ICourseExamRepository`

## RESTful API

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/courses` | List course | `CourseFilterRequest` | `PagedResult<CourseListItemResponse>` | JWT | Admin/Student | student chi thay assigned | 200 |
| GET | `/api/courses/{id}` | Chi tiet course | None | `CourseDetailResponse` | JWT | Admin/Assigned Student | access valid | 200, 403, 404 |
| POST | `/api/courses` | Tao course | `CreateCourseRequest` | `CourseDetailResponse` | JWT | Admin | name required, code unique if provided | 201, 400, 409 |
| PUT | `/api/courses/{id}` | Sua course | `UpdateCourseRequest` | `CourseDetailResponse` | JWT | Admin | id exists | 200, 404, 409 |
| DELETE | `/api/courses/{id}` | Soft delete course | None | None | JWT | Admin | no active progress/attempt conflict | 204, 404, 409 |
| POST | `/api/courses/{id}/assign` | Assign course | `AssignCourseRequest` | `ActionResponse` | JWT | Admin | users/groups exist, no duplicate | 200, 400, 404, 409 |
| DELETE | `/api/courses/{id}/assignments/{assignmentId}` | Remove assignment | None | None | JWT | Admin | assignment exists | 204, 404 |

## Business Flow

```txt
Client -> CoursesController -> CourseService -> CourseRepository -> LmsDbContext -> Database
```

## Business Rules

- Khong xoa vat ly course.
- Khong delete course da co learning progress/attempt lien quan neu chua co policy archive.
- Assign course chi chap nhan user/group ton tai.
- Duplicate assignment bi chan.
- Student chi xem course da duoc assign truc tiep hoac qua group.

## DTO

- `CreateCourseRequest`
- `UpdateCourseRequest`
- `CourseDetailResponse`
- `CourseListItemResponse`
- `CourseFilterRequest`
- `AssignCourseRequest`
- `CourseAssignmentResponse`

## Security

- Admin CRUD/assign.
- Student read assigned courses only.

## Logging

- Create/update/delete course.
- Publish/unpublish course.
- Assign/remove course.

## Exception

- `CourseNotFoundException`
- `DuplicateCourseCodeException`
- `CourseAssignmentConflictException`
- `CourseDeleteBlockedException`

## Dependency

- User Management.
- Group Management.
- Audit Logging.

## Development Plan

`Entity -> Repository -> Service -> API -> Unit Test -> Integration Test`

---

# 5. Learning Material

## Tong quan

Muc tieu: quan ly hoc lieu thuoc course, gom text, PDF, file, external link.

Actors:

- Admin: CRUD.
- Student: xem hoc lieu trong course duoc assign.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `LearningMaterial` | Hoc lieu | `Id`, `CourseId`, `Title`, `ContentType`, `TextContent`, `FileUrl`, `ExternalUrl`, `DurationMinutes`, `Order`, audit fields | Link logic toi `Courses` |
| `LearningMaterialFile` | File cua hoc lieu | `Id`, `LearningMaterialId`, `FileRecordId`, `FileName`, `ContentType`, `FileSize` | Link logic toi `LearningMaterials`, `FileRecords` |
| `FileRecord` | Metadata file chung | `Id`, `FileKey`, `OriginalFileName`, `ContentType`, `FileSize`, `StorageProvider`, audit fields | Dung lai cho certificate/report |

## Service Layer

- `ILearningMaterialService`: CRUD material, query by course.
- `IMaterialAccessService`: kiem tra quyen xem material.
- `IFileService`: upload/download metadata via File Management.

## Repository Layer

- `ILearningMaterialRepository`
- `ILearningMaterialFileRepository`
- `IFileRecordRepository`
- `ICourseRepository` de validate `CourseId`

## RESTful API

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/learning-materials` | List material | `LearningMaterialFilterRequest` | `PagedResult<LearningMaterialListItemResponse>` | JWT | Admin/Assigned Student | course access | 200 |
| GET | `/api/learning-materials/{id}` | Detail/viewer | None | `LearningMaterialDetailResponse` | JWT | Admin/Assigned Student | access valid | 200, 403, 404 |
| POST | `/api/learning-materials` | Tao material | `CreateLearningMaterialRequest` | `LearningMaterialDetailResponse` | JWT | Admin | course exists, content type valid | 201, 400, 404 |
| PUT | `/api/learning-materials/{id}` | Sua material | `UpdateLearningMaterialRequest` | `LearningMaterialDetailResponse` | JWT | Admin | id exists | 200, 400, 404 |
| DELETE | `/api/learning-materials/{id}` | Soft delete material | None | None | JWT | Admin | no blocking rule | 204, 404, 409 |

## Business Flow

```txt
Client -> LearningMaterialsController -> LearningMaterialService -> Repository/FileService -> DbContext -> Database
```

## Business Rules

- Material phai thuoc course ton tai.
- `ContentType` chi chap nhan Text/Pdf/File/Link.
- Text material phai co `TextContent`.
- Pdf/File material phai co file metadata.
- Link material phai co URL hop le.
- Student chi xem material cua course duoc assign.

## DTO

- `CreateLearningMaterialRequest`
- `UpdateLearningMaterialRequest`
- `LearningMaterialDetailResponse`
- `LearningMaterialListItemResponse`
- `LearningMaterialFilterRequest`
- `MaterialFileResponse`

## Security

- Admin CRUD.
- Student read assigned only.
- Download file phai kiem tra access.

## Logging

- Create/update/delete material.
- Upload/remove material file.
- Student view material co the log vao progress/audit tuy policy.

## Exception

- `LearningMaterialNotFoundException`
- `CourseNotFoundException`
- `InvalidMaterialContentTypeException`
- `MaterialAccessDeniedException`

## Dependency

- Course Management.
- File Management.
- Learning Progress.
- Audit Logging.

## Development Plan

`Entity -> Repository -> Service -> API -> Unit Test -> Integration Test`

---

# 6. Learning Progress

## Tong quan

Muc tieu: theo doi trang thai hoc cua student theo material/course.

Actors:

- Student: cap nhat progress.
- Admin: xem tien do/report.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `LearningProgress` | Tien do hoc | `Id`, `UserId`, `CourseId`, `LearningMaterialId`, `ProgressPercent`, `IsCompleted`, `LastAccessedDate`, audit fields | Link logic toi `Users`, `Courses`, `LearningMaterials` |

## Service Layer

- `ILearningProgressService`: update progress, get my progress, course summary.
- `ICourseCompletionService`: tinh completion theo course.

## Repository Layer

- `ILearningProgressRepository`
- `IUserRepository`
- `ICourseRepository`
- `ILearningMaterialRepository`

## RESTful API

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/learning-progress` | Cap nhat progress | `UpdateLearningProgressRequest` | `LearningProgressResponse` | JWT | Student | material/course access, percent 0-100 | 200, 400, 403, 404 |
| GET | `/api/learning-progress/my` | Progress cua toi | `LearningProgressFilterRequest` | `PagedResult<LearningProgressResponse>` | JWT | Student | assigned courses only | 200 |
| GET | `/api/courses/{courseId}/progress` | Course progress summary | `CourseProgressFilterRequest` | `CourseProgressSummaryResponse` | JWT | Admin/Assigned Student | access valid | 200, 403, 404 |

## Business Flow

```txt
Client -> LearningProgressController -> LearningProgressService -> LearningProgressRepository -> DbContext -> Database
```

## Business Rules

- `ProgressPercent` tu 0 den 100.
- `IsCompleted = true` khi progress dat nguong completion.
- Khong update progress cho material khong thuoc course.
- Student chi update progress cua chinh minh.
- Course exam co the yeu cau completion truoc khi start exam.

## DTO

- `UpdateLearningProgressRequest`
- `LearningProgressResponse`
- `LearningProgressFilterRequest`
- `CourseProgressSummaryResponse`

## Security

- Student owner only.
- Admin read/report.

## Logging

- Material completed.
- Course completed.
- Progress reset/manual adjustment neu co.

## Exception

- `LearningProgressNotFoundException`
- `MaterialAccessDeniedException`
- `InvalidProgressValueException`

## Dependency

- User Management.
- Course Management.
- Learning Material.

## Development Plan

`Entity -> Repository -> Service -> API -> Unit Test -> Integration Test`

---

# 7. Question Bank

## Tong quan

Muc tieu: quan ly ngan hang cau hoi, category, dap an va do kho.

Actors:

- Admin.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `QuestionCategory` | Chu de/category | `Id`, `Name`, `ParentCategoryId`, audit fields | Parent relation logic trong cung table |
| `Question` | Cau hoi | `Id`, `CategoryId`, `Content`, `QuestionType`, `Difficulty`, `Score`, audit fields | Link logic toi category, answer options |
| `AnswerOption` | Dap an lua chon | `Id`, `QuestionId`, `Content`, `IsCorrect`, `Order`, audit fields | Link logic toi question |

## Service Layer

- `IQuestionCategoryService`: CRUD category.
- `IQuestionService`: CRUD question va answer options.
- `IQuestionValidationService`: validate single/multiple choice rules.

## Repository Layer

- `IQuestionCategoryRepository`
- `IQuestionRepository`
- `IAnswerOptionRepository`

## RESTful API

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/question-categories` | List category | `QuestionCategoryFilterRequest` | `PagedResult<QuestionCategoryResponse>` | JWT | Admin | filter valid | 200 |
| POST | `/api/question-categories` | Tao category | `CreateQuestionCategoryRequest` | `QuestionCategoryResponse` | JWT | Admin | name required | 201, 400, 409 |
| PUT | `/api/question-categories/{id}` | Sua category | `UpdateQuestionCategoryRequest` | `QuestionCategoryResponse` | JWT | Admin | id exists | 200, 404 |
| DELETE | `/api/question-categories/{id}` | Soft delete category | None | None | JWT | Admin | no active question or allowed archive | 204, 404, 409 |
| GET | `/api/questions` | List question | `QuestionFilterRequest` | `PagedResult<QuestionListItemResponse>` | JWT | Admin | filter valid | 200 |
| GET | `/api/questions/{id}` | Detail question | None | `QuestionDetailResponse` | JWT | Admin | id exists | 200, 404 |
| POST | `/api/questions` | Tao question | `CreateQuestionRequest` | `QuestionDetailResponse` | JWT | Admin | answer rules | 201, 400, 422 |
| PUT | `/api/questions/{id}` | Sua question | `UpdateQuestionRequest` | `QuestionDetailResponse` | JWT | Admin | id exists, not locked by published exam if rule | 200, 400, 404, 409 |
| DELETE | `/api/questions/{id}` | Soft delete question | None | None | JWT | Admin | not used by active published exam | 204, 404, 409 |

## Business Flow

```txt
Client -> QuestionsController -> QuestionService -> QuestionRepository/AnswerOptionRepository -> DbContext -> Database
```

## Business Rules

- Single choice phai co dung 1 answer `IsCorrect = true`.
- Multiple choice phai co it nhat 1 answer correct.
- Question phai co it nhat 2 answer options voi choice question.
- Khong expose correct answers cho student truoc khi submit/review hop le.
- Soft delete question khong xoa result/attempt history.

## DTO

- `CreateQuestionCategoryRequest`
- `UpdateQuestionCategoryRequest`
- `QuestionCategoryResponse`
- `CreateQuestionRequest`
- `UpdateQuestionRequest`
- `QuestionDetailResponse`
- `QuestionListItemResponse`
- `QuestionFilterRequest`
- `AnswerOptionRequest`
- `AnswerOptionResponse`

## Security

- Admin only.
- Correct answer chi dung trong admin/question bank va scoring service.

## Logging

- Create/update/delete category.
- Create/update/delete question.
- Change correct answer.

## Exception

- `QuestionNotFoundException`
- `QuestionCategoryNotFoundException`
- `InvalidAnswerConfigurationException`
- `QuestionInUseException`

## Dependency

- Audit Logging.
- Exam Management phu thuoc Question Bank.

## Development Plan

`Entity -> Repository -> Service -> Validator -> API -> Unit Test -> Integration Test`

---

# 8. Exam Management

## Tong quan

Muc tieu: tao, cau hinh, publish bai thi manual/random.

Actors:

- Admin.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `Exam` | Bai thi | `Id`, `Code`, `Name`, `DurationMinutes`, `PassScore`, `AttemptLimit`, `ReviewMode`, `IsPublished`, audit fields | Link logic toi questions, attempts, assignments |
| `ExamQuestion` | Cau hoi trong exam manual | `Id`, `ExamId`, `QuestionId`, `Score`, `Order` | Link logic toi `Exams`, `Questions` |
| `ExamRandomRule` | Rule random question | `Id`, `ExamId`, `CategoryId`, `Difficulty`, `QuestionCount`, `ScorePerQuestion` | Link logic toi exam/category |

## Service Layer

- `IExamService`: CRUD exam, publish/unpublish.
- `IExamQuestionService`: add/remove/reorder manual questions.
- `IExamRandomRuleService`: configure random rules.
- `IExamPublishValidator`: validate exam before publish.

## Repository Layer

- `IExamRepository`
- `IExamQuestionRepository`
- `IExamRandomRuleRepository`
- `IQuestionRepository`

## RESTful API

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/exams` | List exam | `ExamFilterRequest` | `PagedResult<ExamListItemResponse>` | JWT | Admin/Student filtered | student sees available assigned exams | 200 |
| GET | `/api/exams/{id}` | Exam detail | None | `ExamDetailResponse` | JWT | Admin/Assigned Student limited | id/access valid | 200, 403, 404 |
| POST | `/api/exams` | Tao exam | `CreateExamRequest` | `ExamDetailResponse` | JWT | Admin | duration/passScore/reviewMode valid | 201, 400 |
| PUT | `/api/exams/{id}` | Sua exam | `UpdateExamRequest` | `ExamDetailResponse` | JWT | Admin | not locked by attempt rule | 200, 404, 409 |
| DELETE | `/api/exams/{id}` | Soft delete exam | None | None | JWT | Admin | no attempts or archive policy | 204, 404, 409 |
| POST | `/api/exams/{id}/questions` | Add question | `AddExamQuestionRequest` | `ExamDetailResponse` | JWT | Admin | exam/question exists, not duplicate | 200, 404, 409 |
| DELETE | `/api/exams/{id}/questions/{questionId}` | Remove question | None | `ActionResponse` | JWT | Admin | relation exists, not published with attempts | 200, 404, 409 |
| PUT | `/api/exams/{id}/random-rules` | Save random rules | `SaveExamRandomRulesRequest` | `ExamDetailResponse` | JWT | Admin | category/difficulty valid | 200, 400, 404 |
| POST | `/api/exams/{id}/publish` | Publish exam | None | `ActionResponse` | JWT | Admin | valid question source, pass score, duration | 200, 404, 422 |
| POST | `/api/exams/{id}/unpublish` | Unpublish exam | None | `ActionResponse` | JWT | Admin | no active attempt if required | 200, 404, 409 |

## Business Flow

```txt
Client -> ExamsController -> ExamService -> ExamRepository/QuestionRepository -> DbContext -> Database
```

## Business Rules

- Exam publish phai co cau hoi manual hoac random rule hop le.
- `DurationMinutes > 0`.
- `PassScore >= 0`.
- Khong sua cau truc exam neu da co attempt va thay doi lam sai lich su thi.
- Published exam moi duoc assign/start theo policy.
- Review mode dieu khien result review.

## DTO

- `CreateExamRequest`
- `UpdateExamRequest`
- `ExamDetailResponse`
- `ExamListItemResponse`
- `ExamFilterRequest`
- `AddExamQuestionRequest`
- `ExamQuestionResponse`
- `SaveExamRandomRulesRequest`
- `ExamRandomRuleRequest`

## Security

- Admin CRUD/publish.
- Student chi xem exam assigned va khong thay correct answer.

## Logging

- Create/update/delete exam.
- Add/remove question.
- Save random rules.
- Publish/unpublish.

## Exception

- `ExamNotFoundException`
- `ExamPublishValidationException`
- `ExamAlreadyHasAttemptException`
- `ExamQuestionDuplicateException`

## Dependency

- Question Bank.
- Audit Logging.

## Development Plan

`Entity -> Repository -> Service -> Publish validator -> API -> Unit Test -> Integration Test`

---

# 9. Exam Assignment

## Tong quan

Muc tieu: gan bai thi cho user, group hoac course.

Actors:

- Admin.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `ExamAssignment` | Gan exam cho user | `Id`, `ExamId`, `UserId`, `StartDate`, `EndDate`, `AttemptLimitOverride` | Link logic toi `Exams`, `Users` |
| `GroupExamAssignment` | Gan exam cho group | `Id`, `ExamId`, `GroupId`, `StartDate`, `EndDate` | Link logic toi `Exams`, `Groups` |
| `CourseExam` | Exam nam trong course | `Id`, `CourseId`, `ExamId`, `Order` | Link logic toi `Courses`, `Exams` |

## Service Layer

- `IExamAssignmentService`: assign/remove exam cho user/group/course.
- `IExamAccessService`: kiem tra user co quyen thi exam.

## Repository Layer

- `IExamAssignmentRepository`
- `IGroupExamAssignmentRepository`
- `ICourseExamRepository`
- `IExamRepository`
- `IUserRepository`
- `IGroupRepository`
- `ICourseRepository`

## RESTful API

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/exam-assignments` | List assignments | `ExamAssignmentFilterRequest` | `PagedResult<ExamAssignmentResponse>` | JWT | Admin | filter valid | 200 |
| POST | `/api/exams/{id}/assign` | Assign exam | `AssignExamRequest` | `ActionResponse` | JWT | Admin | exam published, users/groups exist | 200, 400, 404, 409 |
| DELETE | `/api/exam-assignments/{id}` | Remove user assignment | None | None | JWT | Admin | assignment exists, no active attempt conflict | 204, 404, 409 |
| DELETE | `/api/group-exam-assignments/{id}` | Remove group assignment | None | None | JWT | Admin | assignment exists | 204, 404 |
| POST | `/api/courses/{courseId}/exams` | Add exam to course | `AddCourseExamRequest` | `CourseExamResponse` | JWT | Admin | course/exam exists | 200, 404, 409 |
| DELETE | `/api/courses/{courseId}/exams/{examId}` | Remove course exam | None | None | JWT | Admin | relation exists | 204, 404, 409 |

## Business Flow

```txt
Client -> ExamAssignmentsController -> ExamAssignmentService -> Repositories -> DbContext -> Database
```

## Business Rules

- Khong duplicate assignment.
- Chi assign exam ton tai va khong deleted.
- Neu policy yeu cau, chi assign exam da publish.
- User duoc access exam qua direct assignment, group assignment hoac course exam.
- Remove assignment khong xoa attempt/result da co.

## DTO

- `AssignExamRequest`
- `ExamAssignmentResponse`
- `ExamAssignmentFilterRequest`
- `AddCourseExamRequest`
- `CourseExamResponse`

## Security

- Admin only for assignment.
- Student access duoc xac dinh boi `IExamAccessService`.

## Logging

- Assign/remove exam.
- Add/remove exam in course.

## Exception

- `ExamAssignmentConflictException`
- `ExamAssignmentNotFoundException`
- `ExamAccessDeniedException`

## Dependency

- User Management.
- Group Management.
- Course Management.
- Exam Management.

## Development Plan

`Entity -> Repository -> Service -> Access service -> API -> Unit Test -> Integration Test`

---

# 10. Exam Engine

## Tong quan

Muc tieu: van hanh qua trinh thi online: start, snapshot, autosave, submit.

Actors:

- Student.
- System.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `ExamAttempt` | Lan lam bai | `Id`, `ExamId`, `UserId`, `StartedAt`, `SubmittedAt`, `DurationMinutes`, `Status`, `Score`, `Passed`, audit fields | Link logic toi user/exam/result |
| `AttemptQuestionSnapshot` | Snapshot cau hoi | `Id`, `AttemptId`, `QuestionId`, `Content`, `QuestionType`, `Score`, `Order` | Link logic toi attempt/question |
| `AttemptAnswerSnapshot` | Snapshot dap an | `Id`, `AttemptId`, `QuestionId`, `AnswerOptionId`, `Content`, `IsCorrect`, `Order` | Correct answer chi dung server-side |
| `AttemptAnswer` | Dap an da chon | `Id`, `AttemptId`, `QuestionId`, `AnswerOptionId` | Link logic toi snapshot |
| `AttemptEvent` | Event runtime | `Id`, `AttemptId`, `EventType`, `EventData`, `CreatedDate` | Link logic toi attempt |

## Service Layer

- `IExamAttemptService`: start, get active attempt, submit.
- `IExamSnapshotService`: tao snapshot.
- `IAttemptAnswerService`: autosave answers.
- `IAttemptEventService`: ghi runtime events.

## Repository Layer

- `IExamAttemptRepository`
- `IAttemptQuestionSnapshotRepository`
- `IAttemptAnswerSnapshotRepository`
- `IAttemptAnswerRepository`
- `IAttemptEventRepository`
- `IExamRepository`
- `IExamAccessService`

## RESTful API

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/exam-attempts/start` | Start exam | `StartExamRequest` | `StartExamResponse` | JWT | Student | exam exists, access, published, attempt limit | 200, 400, 403, 404, 409 |
| GET | `/api/exam-attempts/{attemptId}` | Lay attempt dang thi | None | `ExamAttemptTakingResponse` | JWT | Owner Student | attempt belongs to user, active | 200, 403, 404, 409 |
| POST | `/api/exam-attempts/{attemptId}/autosave` | Autosave answers | `AutosaveAttemptRequest` | `AutosaveAttemptResponse` | JWT | Owner Student | active attempt, snapshot ids valid | 200, 400, 403, 404, 409 |
| POST | `/api/exam-attempts/{attemptId}/submit` | Submit exam | `SubmitAttemptRequest` | `SubmitAttemptResponse` | JWT | Owner Student | active/submittable attempt | 200, 400, 403, 404, 409 |

## Business Flow

```txt
Client -> ExamAttemptsController -> ExamAttemptService -> Snapshot/Answer/Scoring services -> Repositories -> DbContext -> Database
```

## Business Rules

- Start exam phai tao `ExamAttempt`.
- Start exam phai tao snapshot cau hoi/dap an.
- UI khong duoc nhan `IsCorrect` truoc khi submit/review hop le.
- Autosave chi cap nhat attempt active.
- Submit idempotent: submit lan 2 tra result cu.
- Attempt da submitted khong duoc sua answer.
- Auto submit khi het gio phai dung cung submit flow.

## DTO

- `StartExamRequest`
- `StartExamResponse`
- `ExamAttemptTakingResponse`
- `AttemptQuestionResponse`
- `AttemptAnswerOptionResponse`
- `AutosaveAttemptRequest`
- `AutosaveAttemptResponse`
- `SubmitAttemptRequest`
- `SubmitAttemptResponse`

## Security

- Student owner only.
- Admin khong can lay de dang thi cua student tru khi co endpoint review rieng.
- Correct answers protected.

## Logging

- Start exam.
- Autosave.
- Submit.
- Auto submit.
- Suspicious events neu co.

## Exception

- `ExamAccessDeniedException`
- `ExamAttemptNotFoundException`
- `ExamAttemptAlreadySubmittedException`
- `AttemptLimitExceededException`
- `ExamSnapshotCreationException`

## Dependency

- Identity.
- Exam Management.
- Exam Assignment.
- Question Bank.
- Scoring.
- Audit Logging.

## Development Plan

`Entity -> Repository -> Snapshot service -> Attempt service -> Autosave/Submit API -> Unit Test -> Integration Test`

---

# 11. Scoring

## Tong quan

Muc tieu: cham diem tu dong dua tren snapshot cua attempt.

Actors:

- System.
- Admin, neu co endpoint re-score.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `ExamAttempt` | Lan thi | `Id`, `ExamId`, `UserId`, `Status`, `Score`, `Passed` | Input/output scoring |
| `AttemptAnswerSnapshot` | Dap an snapshot | `AttemptId`, `QuestionId`, `AnswerOptionId`, `IsCorrect` | Nguon correct answer server-side |
| `AttemptAnswer` | Dap an user chon | `AttemptId`, `QuestionId`, `AnswerOptionId` | User answers |
| `ExamResult` | Ket qua tong | `AttemptId`, `ExamId`, `UserId`, `Score`, `Passed` | Output |
| `ExamResultDetail` | Ket qua tung cau | `ExamResultId`, `QuestionId`, `IsCorrect`, `ScoreEarned` | Output chi tiet |

## Service Layer

- `IScoringService`: score attempt.
- `IResultGenerationService`: tao result tu scoring output.

## Repository Layer

- `IExamAttemptRepository`
- `IAttemptAnswerRepository`
- `IAttemptAnswerSnapshotRepository`
- `IAttemptQuestionSnapshotRepository`
- `IExamResultRepository`
- `IExamResultDetailRepository`

## RESTful API

Scoring mac dinh la internal service, duoc goi khi submit attempt.

Optional admin API:

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/exam-attempts/{attemptId}/rescore` | Cham lai diem | `RescoreAttemptRequest` | `ExamResultDetailResponse` | JWT | Admin | attempt submitted, reason required | 200, 400, 404, 409 |

## Business Flow

```txt
Submit API -> ExamAttemptService -> ScoringService -> ResultGenerationService -> Result repositories -> Database
```

## Business Rules

- Scoring dua tren snapshot, khong dua question bank live.
- Single choice dung khi selected answer la correct answer duy nhat.
- Multiple choice dung khi tap selected answers trung khop tap correct answers.
- Diem tung cau lay tu `AttemptQuestionSnapshot.Score`.
- Pass/fail so sanh voi `Exam.PassScore`.
- Scoring idempotent voi submitted attempt.

## DTO

- `ScoringResult`
- `QuestionScoreResult`
- `RescoreAttemptRequest`
- `ExamResultDetailResponse`

## Security

- Internal by default.
- Re-score chi Admin va phai audit.

## Logging

- Score generated.
- Re-score attempt.
- Scoring error.

## Exception

- `AttemptNotSubmittedException`
- `SnapshotIncompleteException`
- `ResultAlreadyExistsException`
- `ScoringRuleException`

## Dependency

- Exam Engine.
- Result & History.
- Audit Logging.

## Development Plan

`Scoring service -> Result service -> Unit Test scoring matrix -> Integration Test submit/result`

---

# 12. Result & History

## Tong quan

Muc tieu: cung cap lich su thi, ket qua, review bai lam theo review policy.

Actors:

- Student.
- Admin.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `ExamResult` | Ket qua tong | `Id`, `AttemptId`, `ExamId`, `UserId`, `Score`, `Passed`, `CompletedDate`, audit fields | Link logic toi attempt/exam/user |
| `ExamResultDetail` | Ket qua tung cau | `Id`, `ExamResultId`, `QuestionId`, `IsCorrect`, `ScoreEarned` | Link logic toi result/question |
| `ExamAttempt` | Lan thi | `Id`, `ExamId`, `UserId`, `SubmittedAt`, `Status` | History source |

## Service Layer

- `IResultService`: my results, detail, admin query.
- `IResultReviewService`: build review theo `ReviewMode`.

## Repository Layer

- `IExamResultRepository`
- `IExamResultDetailRepository`
- `IExamAttemptRepository`
- `IExamRepository`

## RESTful API

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/results/my` | Ket qua cua toi | `MyResultFilterRequest` | `PagedResult<ResultListItemResponse>` | JWT | Student | current user only | 200 |
| GET | `/api/results` | Admin query results | `ResultFilterRequest` | `PagedResult<ResultListItemResponse>` | JWT | Admin | filter valid | 200 |
| GET | `/api/results/{id}` | Detail result | None | `ResultDetailResponse` | JWT | Owner/Admin | owner or admin | 200, 403, 404 |
| GET | `/api/results/{id}/review` | Review attempt | None | `ResultReviewResponse` | JWT | Owner/Admin | review mode allows fields | 200, 403, 404 |

## Business Flow

```txt
Client -> ResultsController -> ResultService/ReviewService -> ResultRepository -> DbContext -> Database
```

## Business Rules

- Student chi xem result cua minh.
- Admin xem duoc result theo permission.
- Review phai ton trong `ReviewMode`.
- `NO_REVIEW` khong tra question/answer detail.
- `RESULT_ONLY` chi tra score/pass.
- `ANSWER_ONLY` khong nhat thiet tra correct answer neu policy khac.
- `FULL_REVIEW` tra detail day du sau submit.

## DTO

- `MyResultFilterRequest`
- `ResultFilterRequest`
- `ResultListItemResponse`
- `ResultDetailResponse`
- `ResultReviewResponse`
- `QuestionReviewResponse`

## Security

- Owner check.
- Admin permission.
- Correct answer chi expose theo review policy.

## Logging

- View result detail optional.
- Admin export/query result.
- Review access denied.

## Exception

- `ResultNotFoundException`
- `ResultAccessDeniedException`
- `ReviewNotAllowedException`

## Dependency

- Exam Engine.
- Scoring.
- Exam Management.

## Development Plan

`Repository -> Result service -> Review policy service -> API -> Unit Test -> Integration Test`

---

# 13. Certificate

## Tong quan

Muc tieu: cap chung nhan cho user sau khi pass exam/course theo policy.

Actors:

- Student.
- Admin.
- System.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `Certificate` | Chung nhan | `Id`, `UserId`, `ExamId`, `CertificateCode`, `IssuedDate`, `FileUrl`, audit fields | Link logic toi user/exam/result |
| `CertificateFile` | File PDF chung nhan | `Id`, `CertificateId`, `FileRecordId`, `FileName`, `ContentType`, `FileSize` | Link logic toi certificate/file |
| `FileRecord` | Metadata file | `Id`, `FileKey`, `Purpose`, `StorageProvider`, audit fields | Dung file storage |

## Service Layer

- `ICertificateService`: list, generate, get detail.
- `ICertificatePdfService`: render PDF.
- `ICertificateEligibilityService`: check dieu kien cap.

## Repository Layer

- `ICertificateRepository`
- `ICertificateFileRepository`
- `IFileRecordRepository`
- `IExamResultRepository`

## RESTful API

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/certificates` | List certificate | `CertificateFilterRequest` | `PagedResult<CertificateListItemResponse>` | JWT | Student/Admin | student owner only | 200 |
| GET | `/api/certificates/{id}` | Detail certificate | None | `CertificateDetailResponse` | JWT | Owner/Admin | access valid | 200, 403, 404 |
| POST | `/api/certificates/generate` | Generate certificate | `GenerateCertificateRequest` | `CertificateDetailResponse` | JWT | Admin/System | result passed, no duplicate | 201, 400, 404, 409 |
| GET | `/api/certificates/{id}/download` | Download PDF | None | File response | JWT | Owner/Admin | file exists, access valid | 200, 403, 404 |

## Business Flow

```txt
Client/System -> CertificatesController/Service -> CertificateEligibilityService -> Pdf/File services -> Repository -> Database
```

## Business Rules

- Chi generate khi result passed.
- `CertificateCode` unique.
- Khong generate duplicate cho cung user/exam/result neu policy khong cho.
- Student chi download certificate cua minh.
- File PDF luu qua File Management/Infrastructure.

## DTO

- `CertificateFilterRequest`
- `CertificateListItemResponse`
- `CertificateDetailResponse`
- `GenerateCertificateRequest`
- `CertificateFileResponse`

## Security

- Student owner only.
- Admin full read/generate.
- System generate sau pass neu configured.

## Logging

- Generate certificate.
- Download certificate.
- Generation failed.

## Exception

- `CertificateNotFoundException`
- `CertificateEligibilityException`
- `DuplicateCertificateException`
- `CertificateFileNotFoundException`

## Dependency

- Result & History.
- File Management.
- Infrastructure PDF.
- Audit Logging.

## Development Plan

`Eligibility service -> Repository -> PDF/File service -> API -> Unit Test -> Integration Test`

---

# 14. Reporting

## Tong quan

Muc tieu: cung cap bao cao hoc tap, thi, cau hoi, export Excel/PDF.

Actors:

- Admin.

## Entity

MVP khong tao bang report rieng.

Doc du lieu tu:

- `Users`
- `Courses`
- `LearningProgress`
- `Exams`
- `ExamAttempts`
- `ExamResults`
- `ExamResultDetails`
- `Certificates`
- `AuditLogs`
- `FileRecords` cho export file metadata neu can

## Service Layer

- `IReportService`: exam summary, pass rate, learning summary, question analysis.
- `IReportExportService`: export Excel/PDF.

## Repository Layer

- `IReportReadRepository`: read model/query tong hop.
- Reuse read methods tu repositories khac khi hop ly.

## RESTful API

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/reports/exam-summary` | Tong quan bai thi | `ExamSummaryReportRequest` | `ExamSummaryReportResponse` | JWT | Admin | date range, exam/course filters | 200, 400 |
| GET | `/api/reports/pass-rate` | Ty le pass | `PassRateReportRequest` | `PassRateReportResponse` | JWT | Admin | filter valid | 200, 400 |
| GET | `/api/reports/question-analysis` | Phan tich cau hoi | `QuestionAnalysisReportRequest` | `QuestionAnalysisReportResponse` | JWT | Admin | filter valid | 200, 400 |
| GET | `/api/reports/learning-summary` | Bao cao hoc tap | `LearningSummaryReportRequest` | `LearningSummaryReportResponse` | JWT | Admin | filter valid | 200, 400 |
| GET | `/api/reports/export/excel` | Export Excel | `ReportExportRequest` | File response | JWT | Admin | reportType valid | 200, 400, 422 |
| GET | `/api/reports/export/pdf` | Export PDF | `ReportExportRequest` | File response | JWT | Admin | reportType valid | 200, 400, 422 |

## Business Flow

```txt
Client -> ReportsController -> ReportService -> ReportReadRepository -> DbContext -> Database
```

## Business Rules

- Bao cao phai filter theo permission Admin.
- Date range phai hop le.
- MVP query truc tiep tu transaction tables.
- Chi tao report snapshot/export job khi co nhu cau async/heavy export.
- Export phai audit.

## DTO

- `ExamSummaryReportRequest`
- `ExamSummaryReportResponse`
- `PassRateReportRequest`
- `PassRateReportResponse`
- `QuestionAnalysisReportRequest`
- `QuestionAnalysisReportResponse`
- `LearningSummaryReportRequest`
- `LearningSummaryReportResponse`
- `ReportExportRequest`

## Security

- Admin only.
- Khong expose PII khong can thiet.

## Logging

- View report.
- Export Excel/PDF.
- Export failed.

## Exception

- `InvalidReportFilterException`
- `ReportExportException`
- `ReportTypeNotSupportedException`

## Dependency

- User Management.
- Course Management.
- Learning Progress.
- Exam Engine.
- Result & History.
- Certificate.
- File Management optional.

## Development Plan

`Read repository -> Report service -> Export service -> API -> Unit Test -> Integration Test`

---

# 15. Audit Logging

## Tong quan

Muc tieu: ghi va truy van audit trail cho thao tac quan trong.

Actors:

- System: ghi audit.
- Admin: xem audit.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `AuditLog` | Ban ghi audit | `Id`, `UserId`, `Action`, `EntityName`, `EntityId`, `BeforeData`, `AfterData`, audit fields | `UserId` logic toi `Users`; `EntityId` la generic logical id |

## Service Layer

- `IAuditLogService`: write audit log.
- `IAuditQueryService`: query audit log.

## Repository Layer

- `IAuditLogRepository`

## RESTful API

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/audit-logs` | Query audit | `AuditLogFilterRequest` | `PagedResult<AuditLogListItemResponse>` | JWT | Admin | page/date/action filters | 200, 400, 403 |
| GET | `/api/audit-logs/{id}` | Audit detail | None | `AuditLogDetailResponse` | JWT | Admin | id exists | 200, 403, 404 |

## Business Flow

```txt
Any Service -> AuditLogService -> AuditLogRepository -> DbContext -> Database
Admin Client -> AuditLogsController -> AuditQueryService -> AuditLogRepository -> Database
```

## Business Rules

- Audit log append-only.
- Khong update/delete audit log trong workflow binh thuong.
- `BeforeData`/`AfterData` nen la JSON da sanitize.
- Khong log password/token plaintext.
- Audit query phai co pagination.

## DTO

- `AuditLogFilterRequest`
- `AuditLogListItemResponse`
- `AuditLogDetailResponse`
- `CreateAuditLogRequest` internal

## Security

- Write internal service only.
- Read Admin only.
- Sensitive field masking.

## Logging

Audit module tu ghi log he thong toi application logs khi write audit fail, nhung khong lam fail business transaction neu policy cho phep.

## Exception

- `AuditLogNotFoundException`
- `AuditWriteException`

## Dependency

- Identity/User for current user id.
- All modules depend on Audit Logging.

## Development Plan

`Entity -> Repository -> Audit service -> Query API -> Unit Test -> Integration Test`

---

# 16. File Management

## Tong quan

Muc tieu: quan ly metadata file va lam facade cho storage infrastructure.

Actors:

- Admin.
- Student by permission.
- System.

## Entity

| Entity | Mo ta | Thuoc tinh chinh | Quan he logic |
| --- | --- | --- | --- |
| `FileRecord` | Metadata file chung | `Id`, `FileKey`, `OriginalFileName`, `StoredFileName`, `ContentType`, `FileSize`, `StorageProvider`, `RelativePath`, `Purpose`, audit fields | Link logic toi material/certificate/export qua file-specific table |
| `LearningMaterialFile` | File hoc lieu | `LearningMaterialId`, `FileRecordId`, metadata denormalized | Link logic toi material/file |
| `CertificateFile` | File certificate | `CertificateId`, `FileRecordId`, metadata denormalized | Link logic toi certificate/file |

## Service Layer

- `IFileRecordService`: tao/read metadata file.
- `IFileStorageService`: upload/download/delete physical file trong Infrastructure.
- `IFileAccessService`: kiem tra quyen truy cap file.

## Repository Layer

- `IFileRecordRepository`
- `ILearningMaterialFileRepository`
- `ICertificateFileRepository`

## RESTful API

File Management co the la internal service cho module khac. Neu expose API:

| Method | URL | Muc dich | Request DTO | Response DTO | Auth | Authorization | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/files` | Upload file | `UploadFileRequest` | `FileRecordResponse` | JWT | Admin/Allowed Student | file size/type/purpose valid | 201, 400, 403, 413 |
| GET | `/api/files/{id}` | File metadata | None | `FileRecordResponse` | JWT | Owner/Admin/By purpose | access valid | 200, 403, 404 |
| GET | `/api/files/{id}/download` | Download file | None | File response | JWT | Owner/Admin/By purpose | access valid | 200, 403, 404 |
| DELETE | `/api/files/{id}` | Mark/delete file metadata | None | None | JWT | Admin/System | no active reference or archive policy | 204, 404, 409 |

## Business Flow

```txt
Client/Module -> FileService -> FileStorageService + FileRecordRepository -> DbContext/Storage -> Database/File system
```

## Business Rules

- Khong luu binary lon trong business table.
- File phai co `Purpose`.
- File size/type phai validate.
- Delete file phai kiem tra reference logic.
- Download phai check permission theo module so huu.

## DTO

- `UploadFileRequest`
- `FileRecordResponse`
- `FileFilterRequest`
- `FileDownloadResponse`

## Security

- JWT required.
- Access theo purpose va owner/module rule.
- Path traversal va unsafe extension phai bi chan.

## Logging

- Upload file.
- Download file.
- Delete/archive file.
- Storage error.

## Exception

- `FileNotFoundException`
- `FileAccessDeniedException`
- `InvalidFileTypeException`
- `FileTooLargeException`
- `FileStorageException`

## Dependency

- Infrastructure storage.
- Learning Material.
- Certificate.
- Reporting export optional.

## Development Plan

`Entity -> Repository -> Storage abstraction -> File service -> API/internal calls -> Unit Test -> Integration Test`

