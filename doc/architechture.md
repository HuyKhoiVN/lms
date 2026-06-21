Đã đổi tên hệ thống thành **lms** và bổ sung project MVC UI tách rời BE. Module vẫn bám theo tài liệu phân tích gốc về Auth, User, Learning, Question Bank, Exam, Scoring, Result, Reporting. 

## 1. Solution tổng thể

```txt
lms
├── src
│   ├── lms.Domain
│   ├── lms.Application
│   ├── lms.Persistence
│   ├── lms.Infrastructure
│   ├── lms.Api
│   └── lms.WebMvc
│
└── tests
    ├── lms.UnitTests
    └── lms.IntegrationTests
```

## 2. Vai trò từng project

| Project              | Vai trò                                                        |
| -------------------- | -------------------------------------------------------------- |
| `lms.Domain`         | Entity, Enum, Business Rule, Domain Event                      |
| `lms.Application`    | Use case, DTO, Interface, Service contract, Validation         |
| `lms.Persistence`    | SQL Server, EF Core, DbContext, Migration, Entity Config       |
| `lms.Infrastructure` | JWT, File Storage, PDF, Email, Background Job                  |
| `lms.Api`            | REST API cho toàn bộ hệ thống                                  |
| `lms.WebMvc`         | Project MVC chỉ làm UI, dùng HTML/CSS/jQuery, gọi API qua AJAX |

## 3. Nguyên tắc tách UI và BE

```txt
lms.WebMvc
    ↓ HTTP / AJAX / jQuery
lms.Api
    ↓ Application Layer
lms.Persistence
    ↓ EF Core
SQL Server
```

`lms.WebMvc` **không reference** tới:

```txt
lms.Domain
lms.Application
lms.Persistence
lms.Infrastructure
```

Nó chỉ gọi API qua endpoint, ví dụ:

```js
$.ajax({
    url: apiBaseUrl + "/api/auth/login",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
        username: $("#username").val(),
        password: $("#password").val()
    }),
    success: function (res) {
        localStorage.setItem("access_token", res.accessToken);
        window.location.href = "/dashboard";
    }
});
```

## 4. Module hóa hệ thống

```txt
01. Identity
02. User Management
03. Group Management
04. Course Management
05. Learning Material
06. Learning Progress
07. Question Bank
08. Exam Management
09. Exam Assignment
10. Exam Engine
11. Scoring
12. Result & History
13. Certificate
14. Reporting
15. Audit Logging
16. File Management
```

## 5. Module BE chi tiết

| Module            | Chức năng chính                                  | Nằm ở                          |
| ----------------- | ------------------------------------------------ | ------------------------------ |
| Identity          | Login, logout, refresh token, đổi mật khẩu, RBAC | Api/Application/Infrastructure |
| User Management   | Tạo user, khóa/mở khóa, reset mật khẩu           | Api/Application/Persistence    |
| Group Management  | Tạo nhóm, thêm user, gán course/exam             | Api/Application/Persistence    |
| Course Management | CRUD khóa học, assign khóa học                   | Api/Application/Persistence    |
| Learning Material | CRUD học liệu text/PDF/file/link                 | Api/Application/Persistence    |
| Learning Progress | Tracking đã học, % hoàn thành                    | Application/Persistence        |
| Question Bank     | CRUD câu hỏi, đáp án, category, difficulty       | Api/Application/Persistence    |
| Exam Management   | Tạo bài thi manual/random, cấu hình exam         | Api/Application/Persistence    |
| Exam Assignment   | Gán bài thi cho user/group/course                | Api/Application/Persistence    |
| Exam Engine       | Start exam, snapshot đề, autosave, submit        | Api/Application/Persistence    |
| Scoring           | Chấm điểm single/multiple choice                 | Application                    |
| Result & History  | Xem điểm, pass/fail, lịch sử thi                 | Api/Application/Persistence    |
| Certificate       | Sinh PDF certificate khi pass                    | Application/Infrastructure     |
| Reporting         | Báo cáo, export Excel/PDF                        | Api/Application/Infrastructure |
| Audit Logging     | Ghi log thao tác quan trọng                      | Application/Persistence        |

## 6. Module UI trong `lms.WebMvc`

```txt
lms.WebMvc
├── Controllers
│   ├── AuthController.cs
│   ├── DashboardController.cs
│   ├── UsersController.cs
│   ├── CoursesController.cs
│   ├── MaterialsController.cs
│   ├── QuestionsController.cs
│   ├── ExamsController.cs
│   ├── ExamAttemptController.cs
│   ├── ResultsController.cs
│   └── ReportsController.cs
│
├── Views
│   ├── Auth
│   ├── Dashboard
│   ├── Users
│   ├── Courses
│   ├── Materials
│   ├── Questions
│   ├── Exams
│   ├── ExamAttempt
│   ├── Results
│   └── Reports
│
└── wwwroot
    ├── css
    ├── js
    │   ├── core
    │   │   ├── api-client.js
    │   │   ├── auth.js
    │   │   └── app-config.js
    │   ├── pages
    │   │   ├── login.js
    │   │   ├── users.js
    │   │   ├── courses.js
    │   │   ├── questions.js
    │   │   ├── exams.js
    │   │   ├── exam-attempt.js
    │   │   └── reports.js
    └── libs
        └── jquery
```

Lưu ý: MVC chỉ dùng để routing/trả view HTML. Không dùng Razor để xử lý nghiệp vụ. View chỉ chứa HTML tĩnh, data load bằng jQuery AJAX.

## 7. Cấu trúc API gợi ý

```txt
/api/auth/login
/api/auth/logout
/api/auth/change-password
/api/users
/api/groups
/api/courses
/api/learning-materials
/api/learning-progress
/api/question-categories
/api/questions
/api/exams
/api/exam-assignments
/api/exam-attempts/start
/api/exam-attempts/{id}/autosave
/api/exam-attempts/{id}/submit
/api/results/my
/api/certificates/{id}/download
/api/reports/exam-results
/api/audit-logs
```

## 8. Thứ tự triển khai

| Phase | Nội dung                                                     |
| ----- | ------------------------------------------------------------ |
| 1     | Tạo solution `lms`, setup Clean Architecture                 |
| 2     | Tạo `lms.Api`, `lms.WebMvc`, cấu hình gọi API                |
| 3     | Setup SQL Server, EF Core, migration trong `lms.Persistence` |
| 4     | Làm Identity, JWT, phân quyền                                |
| 5     | Làm User, Group, Course, Learning Material                   |
| 6     | Làm Question Bank                                            |
| 7     | Làm Exam Management                                          |
| 8     | Làm Exam Engine: start, snapshot, autosave, submit           |
| 9     | Làm Scoring, Result, History                                 |
| 10    | Làm Certificate, Reporting, Audit Log                        |

## 9. Nguyên tắc bắt buộc

```txt
- Không đặt code truy cập DB trong lms.Api
- Không đặt EF Core trong lms.WebMvc
- Không để lms.WebMvc reference BE project
- lms.WebMvc chỉ gọi lms.Api qua HTTP
- Entity chỉ nằm trong lms.Domain
- DbContext chỉ nằm trong lms.Persistence
- Business logic nằm trong lms.Application
- JWT xử lý ở lms.Api / lms.Infrastructure
- UI dùng HTML + CSS + jQuery
```

Kiến trúc cuối cùng:

```txt
UI riêng:        lms.WebMvc
API riêng:       lms.Api
Business riêng:  lms.Application
Domain riêng:    lms.Domain
DB riêng:        lms.Persistence + SQL Server
External riêng:  lms.Infrastructure
```
