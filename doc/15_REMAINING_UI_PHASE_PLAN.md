# Remaining UI Phase Plan

## Summary

Tai lieu nay khoa lai cac phase UI con lai cho `lms.WebMvc` sau dot refactor student screens va man `/Courses`.

Progress note 2026-06-24:

- Phase 5 da implement xong trong repo: auth screens `/Auth/Login`, `/Auth/ChangePassword`.
- Phase 6 da implement xong trong repo: student route polish, active nav, `/Courses`, exam flow, results, certificates.
- Phase 7 da implement xong o tang layout/foundation.
- Bootstrap audit hien tai:
  - Bootstrap Icons van dang can giu vi shared layouts va admin views con dung rong rai `bi bi-*`.
  - Bootstrap CSS van dang duoc dung gian tiep qua `.table`, `.btn*`, `.form-control`, `.form-select`, va mot so class utility cu.
  - `d-none` xuat hien trong admin exam builder, nen can thay bang utility local truoc khi go Bootstrap CSS.
  - Khong tim thay su dung truc tiep Bootstrap JS API trong shared/admin scripts; `bootstrap.bundle.min.js` la ung vien cleanup sau khi route smoke cuoi cung pass.

Nguon tham chieu chinh:

- `doc/14_LINEAR_STRIPE_UI_REDESIGN/`
- `doc/13_UI_SCREEN_REFACTOR_TASKS.md`
- Trang thai file thuc te trong `src/lms/lms.WebMvc`

Nguyen tac thuc thi:

- Uu tien trang thai repo thuc te hon checkbox cu trong tai lieu.
- Khong doi route, controller contract, mock schema hoac business logic khi chi lam UI.
- Giu UI theo huong LMS workspace: ro hierarchy, de scan, khong landing-page hoa cac man van hanh.
- Moi phase phai build/smoke test truoc khi sang phase tiep theo.

## Phase 5 - Auth Screens

Muc tieu:

- Hoan thien UI `/auth/login` va `/auth/changepassword` theo auth theme moi.
- Giu nguyen login mock, role demo cards, redirect logic va validation hien co.

Files chinh:

- `src/lms/lms.WebMvc/Views/Auth/Login.cshtml`
- `src/lms/lms.WebMvc/Views/Auth/ChangePassword.cshtml`
- `src/lms/lms.WebMvc/wwwroot/css/pages.css`
- `src/lms/lms.WebMvc/wwwroot/js/pages/login.js`
- `src/lms/lms.WebMvc/wwwroot/js/pages/change-password.js`

Thu tu task:

1. Refactor login layout thanh auth workspace 2 cot: visual summary, role demo cards, form card.
2. Refactor change password thanh layout account security: form chinh, rule panel, current mock password note.
3. Chuan hoa auth CSS: radius 8px cho card/tool surface, focus state ro, mobile stack on dinh.
4. Kiem tra JS logic khong bi doi: submit, validation, loading, toast, redirect.

Acceptance checklist:

- Login nhin hien dai, dang tin cay, khong chi la form tinh.
- Demo account Student/Admin ro vai tro va van click de dien credentials.
- Change password doc rule nhanh, form khong qua tai.
- Mobile khong overlap, khong scroll ngang.
- VI/EN title, label, error text khong vo layout.

Test commands:

```powershell
node --check src\lms\lms.WebMvc\wwwroot\js\pages\login.js
node --check src\lms\lms.WebMvc\wwwroot\js\pages\change-password.js
dotnet build src\lms\lms.WebMvc\lms.WebMvc.csproj /p:UseAppHost=false
```

Rui ro can tranh:

- Khong doi mock account `admin / 123456`, `student01 / 123456`.
- Khong pha redirect `returnUrl`.
- Khong them validation backend gia.

## Phase 6 - Student Polish And Route Consistency

Muc tieu:

- Dong bo cac man student da refactor, dac biet `/Courses` moi them.
- Sua cac van de active nav, copy thieu dau, i18n key, responsive va smoke route.

Files chinh:

- `src/lms/lms.WebMvc/Views/Shared/_Layout.cshtml`
- `src/lms/lms.WebMvc/Views/Home/Index.cshtml`
- `src/lms/lms.WebMvc/Views/Courses/Index.cshtml`
- `src/lms/lms.WebMvc/Views/LearningMaterials/*.cshtml`
- `src/lms/lms.WebMvc/Views/Exams/*.cshtml`
- `src/lms/lms.WebMvc/Views/Results/*.cshtml`
- `src/lms/lms.WebMvc/Views/Certificates/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/css/utilities.css`
- Student page scripts in `src/lms/lms.WebMvc/wwwroot/js/pages/`

Thu tu task:

1. Kiem tra route `/`, `/Courses`, `/LearningMaterials`, `/Exams`, `/Results`, `/Certificates`.
2. Sua active nav de dung controller hien tai, khong hardcode Home active.
3. Chuan hoa text tieng Viet bi mat dau neu co trong cac view moi sua.
4. Dong bo empty/loading/filter state va card sizing giua Courses, Materials, Exams, Results, Certificates.
5. Responsive smoke tai desktop, tablet, mobile.

Acceptance checklist:

- Header active dung voi route dang xem.
- `/Courses` co cung chat luong UI voi cac man student khac.
- Khong con text khong dau o UI chinh neu i18n/view dang hien truc tiep.
- Card/filter/table khong tran container tren mobile.
- Cac action link giua Courses, Materials, Exams, Results, Certificates di dung route.

Test commands:

```powershell
node --check src\lms\lms.WebMvc\wwwroot\js\pages\student-course-list.js
dotnet build src\lms\lms.WebMvc\lms.WebMvc.csproj /p:UseAppHost=false
```

Rui ro can tranh:

- Khong sua mock data schema neu chi can polish UI.
- Khong lam man exam taking qua nhieu decorative element.
- Khong xoa cac i18n attributes dang ton tai.

## Phase 7 - Admin Foundation And Layout Cleanup

Muc tieu:

- Don nen tang admin/auth layout truoc khi refactor admin screens.
- Audit Bootstrap dependency de biet cai gi co the thay bang local CSS.

Files chinh:

- `src/lms/lms.WebMvc/Views/Shared/_AdminLayout.cshtml`
- `src/lms/lms.WebMvc/Views/Shared/_AuthLayout.cshtml`
- `src/lms/lms.WebMvc/wwwroot/css/layout.css`
- `src/lms/lms.WebMvc/wwwroot/css/components.css`
- `src/lms/lms.WebMvc/wwwroot/css/pages.css`
- `src/lms/lms.WebMvc/wwwroot/css/utilities.css`
- `src/lms/lms.WebMvc/wwwroot/js/core/ui.js`

Thu tu task:

1. Audit Bootstrap classes/icons con dung trong shared layouts va admin views.
2. Chuan hoa admin shell: sidebar, topbar, content width, mobile behavior.
3. Chuan hoa auth layout language switcher va page background.
4. Them utility thieu neu can: hidden, responsive grid, local icon spacing, table wrapper.
5. Chi go Bootstrap CSS/JS sau khi cac route smoke pass va class phu thuoc da duoc thay.

Acceptance checklist:

- Admin layout dense, de scan, khong giong landing page.
- Sidebar/topbar khong overlap content.
- Auth layout ho tro ca login va change password.
- Bootstrap removal co checklist ro, khong go som.

Test commands:

```powershell
dotnet build src\lms\lms.WebMvc\lms.WebMvc.csproj /p:UseAppHost=false
```

Rui ro can tranh:

- Khong go Bootstrap Icons neu view van con `bi bi-*`.
- Khong doi nav route neu controller/action van ton tai.
- Khong them global CSS lam vo student screens da refactor.

## Phase 8 - Admin Management Screens

Muc tieu:

- Refactor nhom admin management screens theo huong operational dashboard: gon, ro, thao tac nhanh.

Screens:

- `/admin`
- `/admin/users`
- `/admin/groups`
- `/admin/groups/detail/{id}`
- `/admin/courses`
- `/admin/courses/detail/{id}`
- `/admin/learningmaterials`

Files chinh:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Dashboard/Index.cshtml`
- `src/lms/lms.WebMvc/Areas/Admin/Views/Users/Index.cshtml`
- `src/lms/lms.WebMvc/Areas/Admin/Views/Groups/Index.cshtml`
- `src/lms/lms.WebMvc/Areas/Admin/Views/Groups/Detail.cshtml`
- `src/lms/lms.WebMvc/Areas/Admin/Views/Courses/Index.cshtml`
- `src/lms/lms.WebMvc/Areas/Admin/Views/Courses/Detail.cshtml`
- `src/lms/lms.WebMvc/Areas/Admin/Views/LearningMaterials/Index.cshtml`
- Related admin page scripts in `src/lms/lms.WebMvc/wwwroot/js/pages/`

Thu tu task:

1. Admin dashboard: metrics, charts, activity, clear fallback states.
2. Users: filter/table/modal polish, avatar/status/action hierarchy.
3. Groups and group detail: member/course/exam assignment panels.
4. Courses and course detail: visual course identity, table/card balance, material/exam sections.
5. Learning materials: type badges, preview placeholders, modal polish.

Acceptance checklist:

- Admin screens van dense va scannable.
- Table row hover/action state ro.
- Modals de scan, khong thay doi data contract.
- Image slots co fixed aspect ratio, khong gay layout shift.
- Empty/loading states co mat tren cac list chinh.

Test commands:

```powershell
node --check src\lms\lms.WebMvc\wwwroot\js\pages\admin-dashboard.js
node --check src\lms\lms.WebMvc\wwwroot\js\pages\user-list.js
node --check src\lms\lms.WebMvc\wwwroot\js\pages\group-list.js
node --check src\lms\lms.WebMvc\wwwroot\js\pages\group-detail.js
node --check src\lms\lms.WebMvc\wwwroot\js\pages\course-list.js
node --check src\lms\lms.WebMvc\wwwroot\js\pages\course-detail.js
node --check src\lms\lms.WebMvc\wwwroot\js\pages\learning-material-list.js
dotnet build src\lms\lms.WebMvc\lms.WebMvc.csproj /p:UseAppHost=false
```

Rui ro can tranh:

- Khong bien admin thanh card-heavy decorative UI.
- Khong lam table mat kha nang scan nhanh.
- Khong doi create/edit/delete mock behavior.

## Phase 9 - Admin Exam, Report And Audit Screens

Muc tieu:

- Refactor nhom nghiep vu exam/report/audit, uu tien readability va thao tac lap lai.

Screens:

- `/admin/questions`
- `/admin/exams`
- `/admin/exams/builder/{id}`
- `/admin/reports`
- `/admin/auditlogs`

Files chinh:

- `src/lms/lms.WebMvc/Areas/Admin/Views/Questions/Index.cshtml`
- `src/lms/lms.WebMvc/Areas/Admin/Views/Exams/Index.cshtml`
- `src/lms/lms.WebMvc/Areas/Admin/Views/Exams/Builder.cshtml`
- `src/lms/lms.WebMvc/Areas/Admin/Views/Reports/Index.cshtml`
- `src/lms/lms.WebMvc/Areas/Admin/Views/AuditLogs/Index.cshtml`
- Related admin page scripts in `src/lms/lms.WebMvc/wwwroot/js/pages/`

Thu tu task:

1. Questions: question bank table, difficulty/type badges, editor modal states.
2. Exams: status hierarchy, assignment/publish actions, filter/table polish.
3. Exam builder: sticky summary, section hierarchy, tabs/settings/questions readability.
4. Reports: chart shells, filter card, export actions, fallback/empty states.
5. Audit logs: dense log table, action/entity badges, detail modal.

Acceptance checklist:

- Question editor ro correct answer state.
- Exam builder khong bi roi khi nhieu cau hoi/settings.
- Reports co chart fallback neu Chart.js fail.
- Audit logs uu tien doc nhanh, khong decorative qua muc.
- Tat ca modal/action states co hover/focus/loading khi logic da co.

Test commands:

```powershell
node --check src\lms\lms.WebMvc\wwwroot\js\pages\question-list.js
node --check src\lms\lms.WebMvc\wwwroot\js\pages\exam-list.js
node --check src\lms\lms.WebMvc\wwwroot\js\pages\exam-builder-general.js
node --check src\lms\lms.WebMvc\wwwroot\js\pages\admin-reports.js
node --check src\lms\lms.WebMvc\wwwroot\js\pages\admin-audit-logs.js
dotnet build src\lms\lms.WebMvc\lms.WebMvc.csproj /p:UseAppHost=false
```

Rui ro can tranh:

- Khong doi exam builder data model.
- Khong lam lo dap an trong exam/question UI ngoai ngu can thiet.
- Khong them parallax/large imagery vao form-heavy screens.

## Phase 10 - Final Validation

Muc tieu:

- Chot UI refactor bang build, JS checks, route smoke va visual QA tren nhieu viewport.

Route smoke list:

- `/`
- `/Courses`
- `/LearningMaterials`
- `/LearningMaterials/Viewer/1`
- `/Exams`
- `/Exams/Start/1`
- `/Exams/Take/1`
- `/Results`
- `/Results/Detail/1`
- `/Certificates`
- `/Auth/Login`
- `/Auth/ChangePassword`
- `/Admin`
- `/Admin/Users`
- `/Admin/Groups`
- `/Admin/Groups/Detail/1`
- `/Admin/Courses`
- `/Admin/Courses/Detail/1`
- `/Admin/LearningMaterials`
- `/Admin/Questions`
- `/Admin/Exams`
- `/Admin/Exams/Builder/1`
- `/Admin/Reports`
- `/Admin/AuditLogs`

Thu tu task:

1. Run `node --check` cho tat ca JS da sua.
2. Run `dotnet build`.
3. Start temp server tu output rieng neu can tranh lock `bin/`.
4. Smoke route desktop.
5. Visual QA tai `1366px`, `1024px`, `768px`, `390px`.
6. Kiem tra VI/EN runtime neu co i18n switcher tren layout.
7. Doi chieu voi acceptance cua tung phase, ghi lai backlog neu con loi nho.

Acceptance checklist:

- Build pass.
- Khong route nao trong smoke list loi render.
- Khong co overlap, clipping, scroll ngang ngoai table wrapper co chu dich.
- Text tieng Viet va English khong vo button/card/header.
- Student, Auth, Admin co identity khac nhau nhung cung design system.

Test commands:

```powershell
dotnet build src\lms\lms.WebMvc\lms.WebMvc.csproj /p:UseAppHost=false
rg -n "bi bi-|bootstrap|d-none|table table|text-end|row|col-" src\lms\lms.WebMvc\Views src\lms\lms.WebMvc\Areas\Admin\Views src\lms\lms.WebMvc\wwwroot\css
```

Rui ro can tranh:

- Khong danh dau phase xong neu chua smoke route.
- Khong cleanup build artifacts khi server/temp process con dang chay.
- Khong sua unrelated files trong dot final validation.

## Documentation Maintenance

Khi hoan thanh tung phase:

- Cap nhat tai lieu nay bang checkbox hoac note ngan o phase tuong ung.
- Neu tao issue/backlog moi, ghi vao `doc/13_UI_SCREEN_REFACTOR_TASKS.md` hoac tai lieu follow-up rieng.
- Neu phat hien blueprint cu sai voi repo thuc te, uu tien ghi correction vao tai lieu execution nay thay vi sua lan man nhieu file docs.
