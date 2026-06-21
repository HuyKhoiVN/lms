# Modern EdTech UI Upgrade Plan

## Summary

Upgrade `lms.WebMvc` to a richer Modern EdTech SaaS Dashboard experience using ASP.NET MVC, HTML, CSS, jQuery, Bootstrap Icons, and optional Chart.js. This UI pass must not edit the files owned by I18N tasks 17, 18, and 19.

## Protected Files

Do not edit these files during this UI upgrade:

- `src/lms/lms.WebMvc/Views/Exams/Index.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-exam-list.js`
- `src/lms/lms.WebMvc/Views/Exams/Start.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-exam-start.js`
- `src/lms/lms.WebMvc/Views/Exams/Take.cshtml`
- `src/lms/lms.WebMvc/wwwroot/js/pages/student-exam-taking.js`
- `src/lms/lms.WebMvc/wwwroot/i18n/vi.json`
- `src/lms/lms.WebMvc/wwwroot/i18n/en.json`

## Implementation Changes

- Add shared motion and interaction styles in `wwwroot/css/animations.css`, and include it in all shared layouts after `components.css`.
- Enhance `layout.css` with modern sticky headers, responsive sidebar drawer, sidebar collapsed state, active navigation states, user dropdown anchoring, and mobile backdrop behavior.
- Enhance `components.css` with image cards, hover effects, toast, modal, dropdown, loading skeleton, empty state, animated progress bars, and chart placeholders.
- Split UI behavior into focused jQuery modules:
  - `wwwroot/js/core/dropdown.js`
  - `wwwroot/js/core/toast.js`
  - `wwwroot/js/core/modal.js`
  - `wwwroot/js/core/ui.js`
  - `wwwroot/js/components/charts.js`
- Keep backward compatibility for page scripts by preserving `Lms.ui.showToast`, `Lms.ui.showModal`, `Lms.ui.closeModal`, `Lms.ui.setButtonLoading`, and `Lms.ui.clearButtonLoading`.
- Add generated local demo illustrations under `wwwroot/images/demo/` and document their source in `sources.md`.
- Use Bootstrap Icons via CDN in layouts. Use Chart.js via CDN where chart mock rendering is needed, with HTML/CSS fallback if `window.Chart` is not available.

## Safe Scope

The upgrade can touch shared layouts, shared CSS/JS, admin dashboard/report charts, and non-exam page visuals. Student exam list/start/take files remain untouched and only receive indirect shared CSS/layout improvements.

## Test Plan

- Run `node --check` for all updated/new JS modules.
- Build `lms.WebMvc` with `dotnet build src\lms\lms.WebMvc\lms.WebMvc.csproj -o D:\tmp\lms-webmvc-build-check /p:UseAppHost=false`.
- Smoke test safe routes: `/`, `/admin`, `/admin/courses`, `/admin/learningmaterials`, `/admin/questions`, `/admin/exams`, `/admin/reports`, `/admin/auditlogs`, `/learningmaterials`, `/results`, `/certificates`.
- Do not smoke-test `/exams`, `/exams/start/*`, or `/exams/take/*` while I18N tasks 17-19 are in progress unless explicitly requested.
