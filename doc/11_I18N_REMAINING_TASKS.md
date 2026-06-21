# Checklist I18N UI LMS - Các Task Còn Lại

## Mục tiêu

Refactor các màn UI còn lại của `lms.WebMvc` sang cơ chế đa ngôn ngữ ở frontend:

- Tiếng Việt là mặc định.
- UI chỉ dùng code key và hai file JSON frontend:
  - `src/lms/lms.WebMvc/wwwroot/i18n/vi.json`
  - `src/lms/lms.WebMvc/wwwroot/i18n/en.json`
- Text tĩnh trong Razor dùng `data-i18n`, `data-i18n-placeholder`, `data-i18n-aria`, `data-i18n-title`, hoặc `data-i18n-value`.
- Text động trong JavaScript dùng `Lms.i18n.t(key, params, fallback)`.
- Mỗi lượt chỉ thực hiện đúng task được yêu cầu, trừ khi user nói rõ muốn làm nhiều task.

## Các Task Đã Hoàn Thành

Không làm lại các task này nếu user không yêu cầu:

- [x] Task 01: Foundation i18n
- [x] Task 02: Login page
- [x] Task 03: Change password page
- [x] Task 04: Student dashboard
- [x] Task 05: Admin dashboard
- [x] Task 06: User list
- [x] Task 07: Group list
- [x] Task 08: Group detail
- [x] Task 09: Admin course list
- [x] Task 10: Admin course detail

## Quy Tắc Thực Hiện Mỗi Task

1. Nêu rõ tên task ở đầu quá trình.
2. Đọc các file liên quan trước khi sửa.
3. Chỉ sửa đúng view, JS page script, và `vi.json` / `en.json` của task đó.
4. Fallback text trong Razor phải là tiếng Việt.
5. Không đổi logic nghiệp vụ, route, mock data schema, controller, hoặc backend reference.
6. Với text động trong JS:
   - Tạo helper:
     ```js
     function t(key, params, fallback) {
       return Lms.i18n ? Lms.i18n.t(key, params, fallback) : (fallback || key);
     }
     ```
   - Dùng `renderPageTitle()` nếu page có JS riêng.
   - Nếu page render dữ liệu mock bằng JS, cache state và render lại khi đổi ngôn ngữ:
     ```js
     $(document).on("lms:i18n:changed", render);
     ```
   - Nếu JS cần đợi dictionary sẵn sàng trước khi render:
     ```js
     if (Lms.i18n && Lms.i18n.ready) {
       Lms.i18n.ready.always(loadPageData);
       return;
     }
     loadPageData();
     ```
7. Các value nghiệp vụ dùng để filter như `Published`, `Draft`, `Active`, `Locked`, `Admin`, `Student` phải giữ nguyên trong data/value. Chỉ dịch label hiển thị.
8. Sau khi sửa phải kiểm tra:
   - `node --check` cho JS đã sửa.
   - Parse `vi.json` và `en.json`.
   - `dotnet build src\lms\lms.WebMvc\lms.WebMvc.csproj -o D:\tmp\lms-webmvc-build-check /p:UseAppHost=false`
   - Smoke test route liên quan nếu task có view route.
9. Nếu chạy local server để smoke test, phải dọn process sau test.

## Lệnh Kiểm Tra Chuẩn

Kiểm tra JSON:

```powershell
node -e "const fs=require('fs'); ['src/lms/lms.WebMvc/wwwroot/i18n/vi.json','src/lms/lms.WebMvc/wwwroot/i18n/en.json'].forEach(f=>JSON.parse(fs.readFileSync(f,'utf8'))); console.log('i18n json ok');"
```

Build:

```powershell
dotnet build src\lms\lms.WebMvc\lms.WebMvc.csproj -o D:\tmp\lms-webmvc-build-check /p:UseAppHost=false
```

Smoke test route:

```powershell
$existing = Get-CimInstance Win32_Process | Where-Object { ($_.Name -eq 'dotnet.exe' -and $_.CommandLine -like '*lms.WebMvc.csproj*') -or $_.Name -eq 'lms.WebMvc.exe' }
$existing | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
$p = Start-Process dotnet -ArgumentList 'run --project src\lms\lms.WebMvc\lms.WebMvc.csproj --urls http://localhost:5194' -WorkingDirectory 'd:\HuyKhoi\lms' -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 8
try {
  $r = Invoke-WebRequest -UseBasicParsing http://localhost:5194/ROUTE-HERE -TimeoutSec 15
  "HTTP $($r.StatusCode)"
} finally {
  Get-CimInstance Win32_Process | Where-Object { ($_.Name -eq 'dotnet.exe' -and $_.CommandLine -like '*lms.WebMvc.csproj*') -or $_.Name -eq 'lms.WebMvc.exe' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
}
```

## Task 11: Admin Learning Material List

Mục tiêu: refactor màn quản lý tài liệu học tập của admin.

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/LearningMaterials/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/learning-material-list.js`
- `src/lms/lms.WebMvc/wwwroot/i18n/vi.json`
- `src/lms/lms.WebMvc/wwwroot/i18n/en.json`

Yêu cầu:

- Thêm namespace gợi ý: `materials.adminListPage`.
- Dịch page title, breadcrumb, subtitle, metric labels, filter labels/options, table/card headers.
- Dịch modal create/edit/delete nếu JS có.
- Dịch empty/loading/error state, validation, toast.
- Giữ nguyên value nghiệp vụ như type/status trong mock data; chỉ dịch label hiển thị.
- Smoke route: `/admin/learningmaterials` hoặc route thực tế của controller.

## Task 12: Admin Question List

Mục tiêu: refactor ngân hàng câu hỏi admin.

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Questions/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/question-list.js`
- `vi.json`
- `en.json`

Yêu cầu:

- Namespace gợi ý: `questions.listPage`.
- Dịch search/filter/category/difficulty/type/status/action.
- Dịch question editor modal nếu nằm trong page script.
- Dịch single choice/multiple choice labels, answer option labels, validation, delete confirm.
- Dịch empty/loading/error/toast.
- Không đổi logic chọn đáp án đúng.
- Smoke route: `/admin/questions`.

## Task 13: Admin Exam List

Mục tiêu: refactor danh sách bài thi admin.

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Exams/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/exam-list.js`
- `vi.json`
- `en.json`

Yêu cầu:

- Namespace gợi ý: `exams.adminListPage`.
- Dịch metric cards, filters, table headers, card/table action labels.
- Dịch status `Draft`, `Published`, assignment labels, duration/pass score/question count label.
- Dịch modal publish/assign nếu có trong JS.
- Dịch validation/toast/empty/loading/error.
- Smoke route: `/admin/exams`.

## Task 14: Admin Exam Builder

Mục tiêu: refactor màn builder bài thi.

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Exams/Builder.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/exam-builder-general.js`
- `vi.json`
- `en.json`

Yêu cầu:

- Namespace gợi ý: `exams.builderPage`.
- Dịch tabs: General, Questions, Assignment, Settings.
- Dịch field labels, placeholders, review policy, random rule builder, selected question summary.
- Dịch validation, publish confirmation, assignment messages, empty/loading/error.
- Giữ nguyên policy/status values trong mock data.
- Smoke route: `/admin/exams/builder` hoặc route thực tế đang dùng.

## Task 15: Student Material List

Mục tiêu: refactor danh sách tài liệu học tập phía học viên.

Files dự kiến:

- `src/lms/lms.WebMvc/Views/LearningMaterials/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-material-list.js`
- `vi.json`
- `en.json`

Yêu cầu:

- Namespace gợi ý: `materials.studentListPage`.
- Dịch hero/page header, filters, material card/list, progress/status.
- Dịch type labels: text, PDF, file, link nếu hiển thị.
- Dịch empty/loading/error/toast.
- Smoke route: `/learningmaterials`.

## Task 16: Student Material Viewer

Mục tiêu: refactor viewer tài liệu phía học viên.

Files dự kiến:

- `src/lms/lms.WebMvc/Views/LearningMaterials/Viewer.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-material-viewer.js`
- `vi.json`
- `en.json`

Yêu cầu:

- Namespace gợi ý: `materials.viewerPage`.
- Dịch title, breadcrumbs, viewer labels, PDF placeholder, file/link action, progress action.
- Dịch mark progress, toast, empty/loading/error.
- Smoke route: route viewer mẫu có id, ví dụ `/learningmaterials/viewer/1` nếu tồn tại.

## Task 17: Student Exam List

Mục tiêu: refactor danh sách bài thi phía học viên.

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Exams/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-exam-list.js`
- `vi.json`
- `en.json`

Yêu cầu:

- Namespace gợi ý: `exams.studentListPage`.
- Dịch assigned exams, pending/completed labels, rules/action buttons.
- Dịch status, duration, question count, pass score.
- Dịch empty/loading/error/toast.
- Smoke route: `/exams`.

## Task 18: Student Exam Start

Mục tiêu: refactor màn bắt đầu bài thi.

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Exams/Start.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-exam-start.js`
- `vi.json`
- `en.json`

Yêu cầu:

- Namespace gợi ý: `exams.startPage`.
- Dịch exam summary, rules, duration, pass score, question count, start button.
- Không hiển thị đáp án đúng.
- Dịch empty/loading/error/toast.
- Smoke route: route start mẫu có id, ví dụ `/exams/start/1`.

## Task 19: Student Exam Taking

Mục tiêu: refactor màn làm bài thi.

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Exams/Take.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-exam-taking.js`
- `vi.json`
- `en.json`

Yêu cầu:

- Namespace gợi ý: `exams.takePage`.
- Dịch timer labels, question navigator, previous/next/submit, marked/answered/unanswered.
- Dịch autosave, submit confirmation, unanswered count, timeout auto-submit.
- Không thay đổi logic timer/autosave/submit.
- Không hiển thị đáp án đúng trước submit.
- Smoke route: route take mẫu có id, ví dụ `/exams/take/1`.

## Task 20: Student Result List

Mục tiêu: refactor danh sách kết quả phía học viên.

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Results/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-result-list.js`
- `vi.json`
- `en.json`

Yêu cầu:

- Namespace gợi ý: `results.listPage`.
- Dịch filters, table/card headers, score, pass/fail, date, action labels.
- Dịch empty/loading/error/toast.
- Smoke route: `/results`.

## Task 21: Student Result Detail

Mục tiêu: refactor chi tiết kết quả.

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Results/Detail.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-result-detail.js`
- `vi.json`
- `en.json`

Yêu cầu:

- Namespace gợi ý: `results.detailPage`.
- Dịch score summary, correct/wrong count, duration, pass/fail, review policy labels.
- Dịch review area theo policy.
- Dịch empty/loading/error/toast.
- Smoke route: route detail mẫu có id, ví dụ `/results/detail/1`.

## Task 22: Student Certificate List

Mục tiêu: refactor danh sách chứng chỉ.

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Certificates/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-certificate-list.js`
- `vi.json`
- `en.json`

Yêu cầu:

- Namespace gợi ý: `certificates.listPage`.
- Dịch certificate code, issue date, preview/download placeholder.
- Dịch empty/loading/error/toast.
- Smoke route: `/certificates`.

## Task 23: Admin Reports

Mục tiêu: refactor dashboard báo cáo admin.

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Reports/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/admin-reports.js`
- `vi.json`
- `en.json`

Yêu cầu:

- Namespace gợi ý: `reports.adminPage`.
- Dịch metric cards, filters, chart titles, export buttons.
- Dịch date range, exam/course/user/group filter options.
- Dịch empty/loading/error/toast.
- Smoke route: `/admin/reports`.

## Task 24: Admin Audit Logs

Mục tiêu: refactor màn audit log admin.

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/AuditLogs/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/admin-audit-logs.js`
- `vi.json`
- `en.json`

Yêu cầu:

- Namespace gợi ý: `auditLogs.adminPage`.
- Dịch metric labels, filters, table headers, pagination, action/entity labels nếu cần.
- Dịch empty/loading/error/toast.
- Smoke route: `/admin/auditlogs`.

## Task 25: Shared/System Pages Còn Sót

Mục tiêu: refactor các trang nhỏ còn text hard-code.

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Home/Privacy.cshtml`
- `src/lms/lms.WebMvc/Views/Shared/Error.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/dashboard-preview.js` nếu còn được dùng.
- `vi.json`
- `en.json`

Yêu cầu:

- Namespace gợi ý:
  - `privacyPage`
  - `errorPage`
  - `dashboard.previewPage`
- Dịch toàn bộ text tĩnh và text động còn lại.
- Smoke route: `/home/privacy` hoặc `/privacy` tùy route thực tế.

## Task 26: Final I18N Review

Mục tiêu: rà cuối toàn bộ UI sau khi các task trên hoàn tất.

Yêu cầu:

- Search text hard-code còn sót trong:
  - `src/lms/lms.WebMvc/Views/**/*.cshtml`
  - `src/lms/lms.WebMvc/Areas/Admin/Views/**/*.cshtml`
  - `src/lms/lms.WebMvc/wwwroot/js/pages/**/*.js`
- Không tính dữ liệu mock như tên khóa học, tên bài thi, tên user, mô tả mock nghiệp vụ.
- Kiểm tra đổi VI/EN runtime trên các màn chính.
- Build project.
- Smoke test các route chính:
  - `/`
  - `/auth/login`
  - `/auth/changepassword`
  - `/admin`
  - `/admin/users`
  - `/admin/groups`
  - `/admin/groups/detail/1`
  - `/admin/courses`
  - `/admin/courses/detail/1`
  - các route còn lại đã refactor.

## Ghi Chú Cho AI Thực Hiện

- File JSON có thể hiển thị mojibake trong PowerShell nhưng vẫn là UTF-8 hợp lệ. Luôn xác nhận bằng JSON parse thay vì sửa encoding theo cảm tính.
- Khi cần cập nhật JSON dài, có thể dùng Node script parse/sửa/write để tránh lỗi dấu phẩy hoặc mismatch do encoding terminal.
- Không dùng Python để sửa file nếu `apply_patch` hoặc Node script nhỏ là đủ.
- Nếu một task có file JS lớn, có thể thay nguyên file bằng `apply_patch` nếu việc patch nhỏ lẻ dễ sót text.
- Không thêm package i18n mới trừ khi user yêu cầu; project đã có `wwwroot/js/core/i18n.js`.
- Khi báo kết quả cuối task, nêu rõ:
  - Task đã hoàn tất.
  - File đã sửa.
  - Lệnh kiểm tra đã chạy.
  - Route smoke test.
  - Task tiếp theo.
