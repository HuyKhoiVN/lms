# Implementation Sequence

## Phase 1 - Foundation

1. Add design tokens in `site.css`.
2. Add 12-column grid, bento, masonry and local utilities.
3. Add Linear/Stripe surface, card, button, table, form and image-slot variants.
4. Add reveal/parallax helpers in CSS and `wwwroot/js/core/ui.js`.
5. Replace Bootstrap utilities/classes locally before removing Bootstrap links.

## Phase 2 - Layouts

1. Redesign `_Layout.cshtml` student shell.
2. Redesign `_AdminLayout.cshtml` dark admin shell.
3. Redesign `_AuthLayout.cshtml`.
4. Replace Bootstrap Icons with Lucide.
5. Smoke test root, auth, admin.

## Phase 3 - User And Auth Screens

Implement screens 01-11 in order:

1. Student dashboard.
2. Student materials list/viewer.
3. Student exams list/start/take.
4. Student results/certificates.
5. Auth login/change password.

## Phase 4 - Admin Screens

Implement screens 12-23 in order:

1. Admin dashboard.
2. Admin users/groups/courses/materials.
3. Admin questions/exams/builder.
4. Admin reports/audit logs.

## Phase 5 - Validation

- `node --check` all changed JS.
- `dotnet build src\lms\lms.WebMvc\lms.WebMvc.csproj -o D:\tmp\lms-webmvc-build-check /p:UseAppHost=false`.
- Smoke test every route listed in screen plans.
- Desktop/tablet/mobile visual check.
- VI/EN overflow check.
- Confirm layouts no longer load Bootstrap CSS/JS.
