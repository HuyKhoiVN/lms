# UI Screen Refactor Tasks - Modern LMS Style

## Mục tiêu

Refactor UI từng màn của `lms.WebMvc` theo phong cách Modern LMS / EdTech Dashboard.

Tài liệu này chia nhỏ công việc thành các task độc lập để AI/dev có thể triển khai theo từng màn, kiểm tra từng route, và tránh sửa lan sang nghiệp vụ.

Trọng tâm:

- Font chữ và cỡ chữ phù hợp cho cả tiếng Việt và tiếng Anh.
- Tăng mức độ sử dụng hình ảnh, illustration, image slot.
- Thêm background image cho phía học viên, quản trị và auth.
- Tăng hiệu ứng trượt, hover, click, transition, animation.
- Tạo sẵn các khung hình ảnh có kích thước ổn định để có thể thay ảnh thật sau.

## Nguyên tắc chung

- Stack giữ nguyên: ASP.NET MVC, Razor, HTML, CSS, jQuery.
- Không dùng React, Vue, Angular, Blazor.
- Không đổi route, controller, API contract, business logic, mock schema.
- Không sửa i18n JSON nếu task chỉ là visual refactor, trừ khi task đó yêu cầu rõ.
- Image slot phải giữ layout ổn định trước và sau khi paste ảnh thật.
- User screens được phép nhiều hình ảnh và cảm giác learning-oriented hơn.
- Admin screens phải hiện đại nhưng vẫn dense, scannable, thao tác nhanh.
- Hiệu ứng phải nhẹ, không gây mất tập trung.
- Luôn tôn trọng `prefers-reduced-motion`.

## Global Foundation Tasks

### [x] Task 00: Typography & Visual Tokens

Files dự kiến:

- `src/lms/lms.WebMvc/wwwroot/css/site.css`

Yêu cầu:

- Cập nhật font stack:
  - `Inter`, `"Segoe UI"`, `"Noto Sans"`, Arial, sans-serif.
  - Tối ưu hiển thị tiếng Việt có dấu và tiếng Anh.
- Bổ sung hoặc điều chỉnh token:
  - `--font-size-body-user`: `15px` hoặc `16px`.
  - `--font-size-body-admin`: `14px` hoặc `15px`.
  - `--font-size-page-title`: khoảng `30px`.
  - `--font-size-hero-title`: khoảng `44px` đến `56px`.
  - `--font-size-card-title`: khoảng `17px`.
  - `--line-height-body`: khoảng `1.55` đến `1.65`.
- Không dùng chữ dưới `12px` trừ caption phụ.
- Tăng line-height cho text tiếng Việt dài.
- Kiểm tra text tiếng Anh dài không làm vỡ card/header/button.

Acceptance:

- VI/EN đều dễ đọc ở desktop và mobile.
- Page title, section title, card title có hierarchy rõ.
- Admin vẫn gọn; user side thoáng hơn.

### [x] Task 01: Background System

Files dự kiến:

- `src/lms/lms.WebMvc/wwwroot/css/layout.css`
- `src/lms/lms.WebMvc/wwwroot/images/backgrounds/`

Yêu cầu:

- User background:
  - Áp dụng cho `.app-shell-user`, `.learning-main`, `.learning-hero`.
  - Nền sáng, modern learning style.
  - Dùng gradient nhẹ kết hợp background image placeholder.
- Admin background:
  - Áp dụng cho `.app-shell-admin`, `.app-content`.
  - Nền dashboard trung tính, hơi lạnh.
  - Content area có layered gradient rất nhẹ.
  - Sidebar giữ nền đậm, rõ active state.
- Auth background:
  - Nền login/change password riêng.
  - Có visual panel hoặc illustration background.
- Chuẩn bị background assets:
  - `wwwroot/images/backgrounds/user-learning-bg.svg`
  - `wwwroot/images/backgrounds/admin-dashboard-bg.svg`
  - `wwwroot/images/backgrounds/auth-bg.svg`

Acceptance:

- User, Admin, Auth có cảm giác khác nhau rõ ràng.
- Background không làm giảm contrast text.
- Không gây layout shift khi ảnh nền chưa load.

### [x] Task 02: Image Slot System

Files dự kiến:

- `src/lms/lms.WebMvc/wwwroot/css/components.css`
- `src/lms/lms.WebMvc/wwwroot/images/placeholders/`

Yêu cầu:

- Tạo bộ class dùng lại:
  - `.image-slot-sm`: `96x72`.
  - `.image-slot-md`: `320x180`, tỷ lệ `16:9`.
  - `.image-slot-lg`: `520x292`, tỷ lệ `16:9`.
  - `.image-slot-hero`: khoảng `640x360` hoặc full-width responsive.
  - `.image-slot-banner`: full width, height khoảng `180-240px`.
  - `.image-slot-avatar`: `40/48/64px` square.
- Mỗi image slot phải có:
  - `aspect-ratio`.
  - `object-fit: cover`.
  - Placeholder state.
  - Optional overlay gradient.
  - Icon/label để biết cần paste ảnh loại gì.
- Tạo placeholder assets:
  - `course-placeholder.svg`
  - `exam-placeholder.svg`
  - `material-placeholder.svg`
  - `dashboard-hero-placeholder.svg`
  - `auth-visual-placeholder.svg`
  - `empty-state-placeholder.svg`
  - `certificate-placeholder.svg`
  - `result-placeholder.svg`

Acceptance:

- Có thể thay ảnh thật bằng cách đổi `src` hoặc file asset, không cần sửa layout.
- Ảnh không bị méo, không làm card/table nhảy chiều cao.

### [x] Task 03: Shared Effects

Files dự kiến:

- `src/lms/lms.WebMvc/wwwroot/css/animations.css`
- `src/lms/lms.WebMvc/wwwroot/css/components.css`
- `src/lms/lms.WebMvc/wwwroot/css/layout.css`

Yêu cầu:

- Bổ sung hiệu ứng:
  - Slide-in page section: `app-slide-up`.
  - Sidebar slide effect.
  - Card hover lift.
  - Button click scale.
  - Image hover zoom.
  - Table row hover.
  - Dropdown slide/fade.
  - Modal scale/slide.
  - Toast slide-in/out.
  - Progress grow animation.
  - Skeleton shimmer.
- Các hiệu ứng phải dùng class chung để page script có thể tái sử dụng.
- Giảm hoặc tắt animation khi `prefers-reduced-motion: reduce`.

Acceptance:

- Hover/click state rõ nhưng không quá lòe loẹt.
- Animation không làm giật layout.
- Mobile vẫn mượt.

## User-Side Screen Tasks

### [x] Task 04: Student Dashboard `/`

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Home/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-dashboard.js`
- Shared/page CSS liên quan

Yêu cầu:

- Hero:
  - Chuyển thành modern hero 2 cột.
  - Bên trái: title, subtitle, primary/secondary actions.
  - Bên phải: `.image-slot-hero` hoặc dashboard illustration.
  - Background hero dùng gradient + `user-learning-bg`.
- Metrics:
  - Tăng font metric value.
  - Icon lớn hơn, có hover.
  - Card có slide-up stagger.
- Course cards:
  - Mỗi card có `.image-slot-md`.
  - Placeholder kích thước `320x180`.
  - Hover zoom ảnh, card lift.
- Pending exams / certificates:
  - Empty state có illustration slot.
  - Progress bar animate khi render.
- Click effect:
  - Button click scale nhẹ.
  - Card action hover rõ.

Acceptance:

- Dashboard nhìn giàu hình ảnh hơn ngay first viewport.
- Course cards vẫn render từ mock data hiện tại.
- Không đổi logic tải dữ liệu dashboard.

### [x] Task 05: Student Materials List `/learningmaterials`

Files dự kiến:

- `src/lms/lms.WebMvc/Views/LearningMaterials/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-material-list.js`

Yêu cầu:

- Page header thêm banner nhỏ với `.image-slot-banner`.
- Filter bar có elevated style nhẹ, có focus/active state rõ.
- Material cards:
  - PDF/video/link mỗi loại có image placeholder riêng.
  - Dùng `.image-slot-md` trong mỗi card.
  - Hover image zoom + card shadow.
- Empty state:
  - Dùng `material-empty-placeholder.svg`.
- Background:
  - Dùng user learning background chung.

Acceptance:

- Material card có visual rõ loại nội dung.
- Filter bar không bị rối trên mobile.
- Empty/loading state có hình minh họa.

### [x] Task 06: Student Material Viewer `/learningmaterials/viewer/{id}`

Files dự kiến:

- `src/lms/lms.WebMvc/Views/LearningMaterials/Viewer.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-material-viewer.js`

Yêu cầu:

- Viewer main area:
  - Thêm `.image-slot-lg` hoặc content preview frame.
  - PDF/video/link placeholder đúng content type.
- Sidebar progress:
  - Progress ring hoặc progress bar animate.
  - Next-step cards có hover.
- Interaction:
  - Mark complete button có click/loading state.
  - Toast success dùng animation.
- Background:
  - Viewer dùng surface sáng, ít decorative để dễ đọc.

Acceptance:

- Nội dung học tập dễ đọc hơn.
- Progress và next actions nổi bật.
- Không đổi logic lưu progress local.

### [x] Task 07: Student Exam List `/exams`

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Exams/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-exam-list.js`

Yêu cầu:

- Chỉ thực hiện sau khi I18N Task 17 hoàn tất nếu vẫn đang chạy.
- Thêm banner `Available exams` với exam background.
- Exam cards:
  - `.image-slot-md` hoặc exam illustration `16:9`.
  - Status badge active/completed/pending.
  - Hover card lift.
- Click:
  - Start/review button click scale.
- Empty/loading:
  - Skeleton card có image skeleton.

Acceptance:

- Không đổi logic chỉ cho bắt đầu bài thi published.
- Không sửa text/i18n nếu task i18n đang làm song song.

### [x] Task 08: Student Exam Start `/exams/start/{id}`

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Exams/Start.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-exam-start.js`

Yêu cầu:

- Chỉ thực hiện sau khi I18N Task 18 hoàn tất nếu vẫn đang chạy.
- Summary card:
  - Thêm top banner `.image-slot-banner`.
  - Hiển thị duration/pass score/question count dạng stat chips.
- Rules:
  - Rule cards có icon, hover nhẹ.
- Start action:
  - Button nổi bật, click scale/loading.
- Background:
  - Tập trung, ít distract, exam-themed gradient.

Acceptance:

- Màn bắt đầu bài thi rõ thông tin và không hiển thị đáp án.
- Không đổi logic kiểm tra exam published.

### [x] Task 09: Student Exam Taking `/exams/take/{id}`

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Exams/Take.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-exam-taking.js`

Yêu cầu:

- Chỉ thực hiện sau khi I18N Task 19 hoàn tất nếu vẫn đang chạy.
- Ưu tiên readability:
  - Tăng font câu hỏi.
  - Answer options có hover, selected, focus state rõ.
  - Question navigator có active/answered/marked animation.
- Timer:
  - Sticky timer pill.
  - Warning pulse khi gần hết giờ.
- Không thêm hình ảnh lớn gây mất tập trung.
- Click:
  - Answer click state.
  - Next/prev button interaction.
- Không đổi logic timer/autosave/submit.

Acceptance:

- Làm bài tập trung, dễ đọc, dễ biết trạng thái câu hỏi.
- Không làm lộ đáp án trước submit.

### [x] Task 10: Student Results List `/results`

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Results/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-result-list.js`

Yêu cầu:

- Header có small result background illustration.
- Metric cards:
  - Score/pass/fail/completed có icon và color state.
- Table:
  - Row hover.
  - Status badge rõ.
  - Optional compact result card mode trên mobile.
- Empty state:
  - Result empty illustration.
- Background:
  - User background chung.

Acceptance:

- Kết quả dễ scan theo điểm, pass/fail, ngày nộp.
- Mobile không phải cuộn ngang quá nhiều nếu có card mode.

### [x] Task 11: Student Result Detail `/results/detail/{id}`

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Results/Detail.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-result-detail.js`

Yêu cầu:

- Thêm score hero section:
  - Score ring/chart placeholder.
  - `.image-slot-sm` cho exam/result visual nếu cần.
- Review cards:
  - Correct/wrong/unanswered states rõ màu.
  - Hover cho từng question review item.
- Side summary:
  - Sticky trên desktop.
- Animation:
  - Score ring grow.
  - Review items slide-up stagger.

Acceptance:

- Người học hiểu nhanh điểm, trạng thái đạt/rớt, review policy.
- Review area không bị rối khi nhiều câu hỏi.

### [x] Task 12: Student Certificates `/certificates`

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Certificates/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-certificate-list.js`

Yêu cầu:

- Certificate card:
  - Preview frame dạng A4 ratio hoặc `16:9`.
  - `.image-slot-lg` cho preview.
- Empty state:
  - Certificate illustration.
- Modal preview:
  - Modal animation giữ hiện tại.
  - Thêm certificate mock background.
- Download/preview buttons:
  - Hover/click effect.

Acceptance:

- Certificate preview có khung rõ để thay ảnh/chứng chỉ thật sau.
- Modal preview không tràn màn mobile.

## Auth Screen Tasks

### [x] Task 13: Login `/auth/login`

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Auth/Login.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/login.js`

Yêu cầu:

- Layout 2 cột:
  - Form card.
  - Visual panel `.image-slot-hero` hoặc `auth-visual-placeholder.svg`.
- Background:
  - `auth-bg.svg`.
  - Gradient nhẹ.
- Typography:
  - Title `32-40px`.
  - Body `15-16px`.
- Interaction:
  - Input focus glow.
  - Submit loading.
  - Role demo cards hover.
- Mobile:
  - Visual panel chuyển thành banner phía trên.

Acceptance:

- Login nhìn hiện đại hơn, không chỉ là form tĩnh.
- Demo account cards rõ vai trò student/admin.

### [x] Task 14: Change Password `/auth/changepassword`

Files dự kiến:

- `src/lms/lms.WebMvc/Views/Auth/ChangePassword.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/change-password.js`

Yêu cầu:

- Form card hiện đại hơn.
- Rule card có icon.
- Strength/rule visual nếu có thể làm bằng CSS.
- Toast success/error animation.
- Background dùng auth theme.

Acceptance:

- Người dùng hiểu rule mật khẩu nhanh.
- Form vẫn đơn giản, không thêm validation backend.

## Admin Screen Tasks

### [x] Task 15: Admin Dashboard `/admin`

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Dashboard/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/admin-dashboard.js`

Yêu cầu:

- Background admin dashboard riêng.
- Top summary hero/banner:
  - `.image-slot-banner` hoặc dashboard illustration.
- Metric cards:
  - Icon lớn.
  - Mini sparkline placeholder.
  - Hover lift.
- Charts:
  - Chart shell fixed height `240-320px`.
  - Loading skeleton trước khi render.
- Recent activity:
  - Row hover.
  - Status/action icon.
- Animation:
  - Metrics slide-up stagger.
  - Charts fade-in.

Acceptance:

- Dashboard có visual richness nhưng vẫn đọc nhanh.
- Chart fallback vẫn hoạt động nếu Chart.js fail.

### [x] Task 16: Admin Users `/admin/users`

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Users/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/user-list.js`

Yêu cầu:

- Page header có subtle admin background strip.
- Metric cards có icon và hover.
- Filter bar:
  - Focus/active state rõ.
  - Sticky trong card nếu danh sách dài.
- Table:
  - Avatar style đẹp hơn.
  - Row hover.
  - Action buttons icon + text.
- Modal:
  - Form spacing tốt hơn.
  - Modal slide/scale.
- Empty/loading:
  - Illustration slot small.

Acceptance:

- Admin thao tác user nhanh, table không quá decorative.
- Modal create/edit/reset password rõ và dễ scan.

### [x] Task 17: Admin Groups `/admin/groups`

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Groups/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/group-list.js`

Yêu cầu:

- Metric cards icon.
- Group table row hover.
- Group avatar hoặc image slot nhỏ.
- Detail button hover/click.
- Empty state có group illustration.
- Modal create/edit có animated sections.

Acceptance:

- Nhìn rõ group status, member count, assigned items.
- Không đổi logic group mock data.

### [x] Task 18: Admin Group Detail `/admin/groups/detail/{id}`

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Groups/Detail.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/group-detail.js`

Yêu cầu:

- Header banner:
  - `.image-slot-banner` cho group/cohort.
- Summary metrics:
  - Members/courses/exams/activity.
- Assignment panels:
  - Course/exam/member cards có hover.
  - Remove action có click feedback.
- Empty state:
  - Riêng cho members/courses/exams.

Acceptance:

- Group detail có cấu trúc rõ theo members/courses/exams.
- Add/remove assignment feedback rõ.

### [x] Task 19: Admin Courses `/admin/courses`

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Courses/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/course-list.js`

Yêu cầu:

- Catalog cards:
  - `.image-slot-md` bắt buộc.
  - Placeholder `320x180`.
  - Hover zoom image, card lift.
- Table:
  - Course thumbnail `96x72`.
  - Progress bar animated.
- Page background:
  - Admin background chung.
- Modal:
  - Thêm image placeholder field/preview nếu không đổi schema thì chỉ UI placeholder.

Acceptance:

- Course list có hình ảnh rõ nhất trong nhóm admin.
- Table vẫn dùng được cho thao tác vận hành nhanh.

### [x] Task 20: Admin Course Detail `/admin/courses/detail/{id}`

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Courses/Detail.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/course-detail.js`

Yêu cầu:

- Hero/banner course image:
  - `.image-slot-banner`.
- Material list:
  - Type image/icon.
  - Hover.
- Exam assignment section:
  - Exam visual cards.
- Progress:
  - Animated progress bars.
- Empty:
  - Illustration per section.

Acceptance:

- Course detail có cảm giác như course management page, không chỉ table/form.
- Không đổi logic course/material/exam assignment.

### [x] Task 21: Admin Learning Materials `/admin/learningmaterials`

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/LearningMaterials/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/learning-material-list.js`

Yêu cầu:

- Material type cards:
  - PDF/video/link icon/image.
  - `.image-slot-sm` trong table rows.
- Filter bar modern.
- Table row hover.
- Modal create/edit:
  - Add preview frame placeholder based on content type.
- Empty/loading:
  - Material illustration.

Acceptance:

- Dễ phân biệt PDF/video/link.
- Modal form không đổi schema dữ liệu.

### [x] Task 22: Admin Questions `/admin/questions`

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Questions/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/question-list.js`

Yêu cầu:

- Keep mostly operational and dense.
- Metric cards with icons.
- Question difficulty/type badges more visual.
- Table row hover.
- Question editor modal:
  - Answer option hover/selected state.
  - Correct answer active state clearer.
- Empty state:
  - Question bank illustration.
- Avoid large background images inside editor.

Acceptance:

- Question editor dễ thao tác, không bị mất tập trung.
- Không đổi logic chọn đáp án đúng.

### [x] Task 23: Admin Exams `/admin/exams`

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Exams/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/exam-list.js`

Yêu cầu:

- Add optional exam card/list visual:
  - Exam thumbnail `96x72` trong table.
  - `.image-slot-md` nếu bổ sung card view.
- Metric cards with icons.
- Status badges stronger.
- Publish/assign modal animation.
- Progress/assignment count visual.
- Background:
  - Exam-themed subtle admin strip.

Acceptance:

- Exam list rõ trạng thái draft/published/assigned.
- Không đổi logic publish/assign mock.

### [x] Task 24: Admin Exam Builder `/admin/exams/builder/{id}`

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Exams/Builder.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/exam-builder-general.js`

Yêu cầu:

- Builder layout:
  - Sticky tab/header.
  - Clear section hierarchy.
- Question/assignment/settings panels:
  - Cards with hover only where clickable.
  - Active tab slide underline.
- Summary side:
  - Sticky summary with visual progress.
- Modal publish:
  - Animated confirmation.
- Avoid decorative background inside form-heavy areas.

Acceptance:

- Builder dễ dùng hơn, nhưng không đổi exam config logic.
- Form-heavy area vẫn tối ưu đọc và nhập liệu.

### [x] Task 25: Admin Reports `/admin/reports`

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Reports/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/admin-reports.js`

Yêu cầu:

- Dashboard report background.
- Filter card:
  - More modern controls.
  - Active filter chips.
- Charts:
  - Fixed chart frame.
  - Empty/loading skeleton.
  - Hover chart cards.
- Snapshot:
  - Add illustration/background strip.
- Export buttons:
  - Icon + hover/click feedback.

Acceptance:

- Reports có cảm giác analytics dashboard.
- Chart fallback vẫn render nếu Chart.js fail.

### [x] Task 26: Admin Audit Logs `/admin/auditlogs`

Files dự kiến:

- `src/lms/lms.WebMvc/Areas/Admin/Views/AuditLogs/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/admin-audit-logs.js`

Yêu cầu:

- Keep dense/scannable.
- Metric cards icon.
- Log table:
  - Row hover.
  - Entity/action badges.
  - Detail action hover.
- Detail modal:
  - Slide/scale animation.
  - Key-value layout clearer.
- Background:
  - Admin background only, no heavy imagery.

Acceptance:

- Audit log vẫn ưu tiên đọc nhanh.
- Detail modal rõ user/action/entity/time.

## Image & Background Assets

Chuẩn bị thư mục:

- `src/lms/lms.WebMvc/wwwroot/images/placeholders/`
- `src/lms/lms.WebMvc/wwwroot/images/backgrounds/`

Background assets cần có:

- `user-learning-bg.svg`
- `admin-dashboard-bg.svg`
- `auth-bg.svg`
- `exam-bg.svg`
- `report-bg.svg`

Placeholder assets cần có:

- `course-placeholder.svg`
- `exam-placeholder.svg`
- `material-placeholder.svg`
- `dashboard-hero-placeholder.svg`
- `auth-visual-placeholder.svg`
- `empty-state-placeholder.svg`
- `certificate-placeholder.svg`
- `result-placeholder.svg`
- `group-placeholder.svg`
- `question-bank-placeholder.svg`

Quy tắc thay ảnh thật:

- Giữ nguyên kích thước slot.
- Chỉ thay file ảnh hoặc `src`.
- Không sửa CSS layout chỉ để thay ảnh.
- Ảnh thật nên có tỷ lệ gần với slot:
  - Card: `16:9`.
  - Banner: `3:1` hoặc `16:5`.
  - Certificate: A4 ratio hoặc `16:9` tùy preview.

## Test Plan

Với mỗi task đã implement:

- Run `node --check` cho JS đã sửa.
- Run:

```powershell
dotnet build src\lms\lms.WebMvc\lms.WebMvc.csproj -o D:\tmp\lms-webmvc-build-check /p:UseAppHost=false
```

- Smoke test route liên quan.
- Kiểm tra desktop và mobile:
  - `1366px`
  - `1024px`
  - `768px`
  - `390px`
- Kiểm tra VI/EN runtime:
  - Text không tràn card.
  - Button không vỡ dòng xấu.
  - Page header không overlap.
- Visual acceptance:
  - Fonts readable in Vietnamese and English.
  - Image slots preserve aspect ratio before and after real images are pasted.
  - Hover/click/slide effects are visible but not distracting.
  - Admin screens remain dense and scannable.
  - User screens feel more visual and learning-oriented.

## Ghi chú bảo vệ I18N Task 17-19

Nếu I18N Task 17-19 trong `doc/11_I18N_REMAINING_TASKS.md` vẫn đang chạy, không sửa các file sau cho đến khi được xác nhận an toàn:

- `src/lms/lms.WebMvc/Views/Exams/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-exam-list.js`
- `src/lms/lms.WebMvc/Views/Exams/Start.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-exam-start.js`
- `src/lms/lms.WebMvc/Views/Exams/Take.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-exam-taking.js`
- `src/lms/lms.WebMvc/wwwroot/i18n/vi.json`
- `src/lms/lms.WebMvc/wwwroot/i18n/en.json`

Trong thời gian đó, các màn student exam chỉ nhận thay đổi gián tiếp từ shared CSS/layout nếu thật sự cần.
