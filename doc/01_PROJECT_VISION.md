# 01_PROJECT_VISION.md

# LMS Project Vision

## 1. Project Overview

### Project Name

lms

### Project Type

Learning Management System (LMS) kết hợp Online Examination System.

### Goal

Xây dựng nền tảng đào tạo nội bộ và đánh giá năng lực trực tuyến cho doanh nghiệp hoặc tổ chức đào tạo.

Hệ thống cho phép:

* Quản lý người dùng
* Quản lý khóa học
* Quản lý học liệu
* Quản lý ngân hàng câu hỏi
* Quản lý bài thi
* Thi trực tuyến
* Chấm điểm tự động
* Theo dõi kết quả học tập
* Báo cáo thống kê
* Cấp chứng nhận hoàn thành

---

# 2. Product Vision

Tạo ra một hệ thống:

* Dễ mở rộng
* Dễ bảo trì
* Hỗ trợ số lượng lớn học viên
* Tối ưu cho thi trực tuyến
* Đảm bảo tính toàn vẹn dữ liệu thi
* Có thể phát triển thành SaaS trong tương lai

Hệ thống phải đáp ứng đồng thời:

* Learning Management
* Examination Management

thay vì chỉ tập trung vào học trực tuyến.

---

# 3. Target Users

## Administrator

Quản trị toàn bộ hệ thống.

Có quyền:

* Quản lý tài khoản
* Quản lý nhóm
* Quản lý khóa học
* Quản lý học liệu
* Quản lý câu hỏi
* Quản lý đề thi
* Xem báo cáo
* Xem audit log

---

## Student

Học viên sử dụng hệ thống.

Có quyền:

* Học học liệu được cấp
* Tham gia bài thi được cấp
* Xem kết quả
* Xem lịch sử học tập
* Tải chứng nhận

---

# 4. Core Business Domains

## Identity

Quản lý:

* Authentication
* Authorization
* User Session

---

## Learning

Quản lý:

* Khóa học
* Học liệu
* Tiến độ học tập

---

## Question Bank

Quản lý:

* Ngân hàng câu hỏi
* Đáp án
* Chủ đề
* Độ khó

---

## Examination

Quản lý:

* Đề thi
* Sinh đề
* Làm bài thi
* Attempt
* Chấm điểm

---

## Reporting

Quản lý:

* Báo cáo học tập
* Báo cáo thi
* Phân tích kết quả

---

# 5. Main Functional Modules

## Authentication & Authorization

* Login
* Logout
* Change Password
* JWT Authentication
* RBAC Authorization

---

## User Management

* Create User
* Edit User
* Lock User
* Reset Password
* Assign Roles

---

## Group Management

* Create Group
* Add Users
* Assign Courses
* Assign Exams

---

## Course Management

* Create Course
* Update Course
* Assign Course

---

## Learning Material Management

* Text Content
* PDF
* Downloadable Files
* External Links

---

## Learning Progress

* Tracking
* Completion Percentage
* Learning History

---

## Question Bank

* Single Choice Questions
* Multiple Choice Questions
* Categories
* Difficulty Levels

---

## Exam Management

* Manual Exam
* Random Exam
* Review Policies
* Exam Rules

---

## Exam Engine

* Start Exam
* Timer
* Autosave
* Submit
* Auto Submit

---

## Scoring

* Automatic Scoring
* Pass/Fail Evaluation

---

## Results

* Exam Results
* Attempt History
* Review Answers

---

## Certificates

* Generate PDF Certificate
* Download Certificate

---

## Reporting

* Learning Reports
* Exam Reports
* Export Excel
* Export PDF

---

## Audit Logging

* Login Logs
* Data Change Logs
* Exam Logs

---

# 6. Business Rules

BR-001

User must login before accessing the system.

---

BR-002

Only administrators can create user accounts.

---

BR-003

Course exams require completed learning materials.

---

BR-004

Standalone exams do not require learning completion.

---

BR-005

Multiple-choice questions require all correct answers to receive points.

---

BR-006

Exam automatically submits when timer expires.

---

BR-007

Exam snapshot must be created when an attempt starts.

---

BR-008

Only the first submission is accepted.

---

BR-009

Certificate is generated only when PASS.

---

BR-010

Important operations must be recorded in audit logs.

---

# 7. Non-Functional Requirements

## Performance

Login Response

< 3 seconds

Exam Loading

< 5 seconds

Exam Submission

< 5 seconds

Report Generation

< 30 seconds

---

## Scalability

Support:

* 500+ concurrent users
* Large question banks
* Large exam attempts

---

## Security

* HTTPS
* JWT Authentication
* Role-Based Access Control
* Password Hashing
* Session Validation

---

## Reliability

* Autosave during exams
* Resume unfinished attempts
* No duplicate submissions
* No data loss

---

# 8. Technical Vision

Backend Architecture

Clean Architecture

Technology

* .NET 9
* ASP.NET Core Web API
* EF Core
* SQL Server

---

Frontend Architecture

MVC UI Project

Technology

* ASP.NET MVC
* HTML
* CSS
* jQuery

Frontend must communicate only through APIs.

No direct database access.

No backend project references.

---

# 9. UI Vision

The provided Figma design is treated as:

* Design System
* UI Kit
* Component Library

The business workflow will be transformed from:

Learning Platform

to

Learning + Examination Platform.

The following visual elements must be preserved:

* Color palette
* Typography
* Layout
* Sidebar
* Cards
* Tables
* Forms

The following business screens must be redesigned:

* Question Bank
* Exam Builder
* Exam Taking
* Results
* Reporting

---

# 10. MVP Scope

Included:

* Authentication
* User Management
* Groups
* Courses
* Learning Materials
* Question Bank
* Exam Management
* Exam Taking
* Results
* Reporting
* Certificates
* Audit Logs

---

# 11. Out of Scope

Not included in MVP:

* Mobile Applications
* AI Proctoring
* Webcam Monitoring
* Face Recognition
* Live Streaming
* Adaptive Learning
* Multi-Tenant SaaS

These features may be added in future releases.

---

# 12. Success Criteria

The MVP is considered successful when:

* Users can learn assigned materials.
* Users can take online exams.
* Exams are scored automatically.
* Results are stored correctly.
* Reports can be generated.
* Certificates can be downloaded.
* Audit logs are recorded.
* The system is stable under normal load.
