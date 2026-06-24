# 23 - Admin Audit Logs

## Route va files lien quan

- Route: `/admin/auditlogs`
- View: `Areas/Admin/Views/AuditLogs/Index.cshtml`
- JS: `wwwroot/js/pages/admin-audit-logs.js`

## Current UI issues

- Audit screen should stay dense but can use clearer action/entity badges.
- Detail modal needs key-value polish.

## Target Linear + Stripe direction

- Security/operations log viewer: dark premium table, muted badges, no heavy imagery.

## Layout redesign

- Thin banner/strip, not large hero.
- Metrics 4 cards.
- Filter bar full width.
- Table with action/entity badges and compact user icon.

## Typography redesign

- Table text 13-14px.
- Description 13px, line-height 1.5.
- Modal title 20-24px.

## Image plan

- Banner: `audit-logs-banner-1600x360.svg`.
- Empty: `empty-audit-640x360.svg`.
- No row photos; use Lucide icons.

## Interaction plan

- Row hover.
- Detail action hover.
- Detail modal glass key-value layout.

## Animation plan

- Metrics stagger.
- Rows fade lightly.
- Modal scale/fade.

## Responsive plan

- Desktop table.
- Mobile table wrapper with readable detail modal.

## i18n safety

- Description field wraps; no fixed height.
- Date/time can nowrap desktop, wrap mobile.

## Acceptance checklist

- [ ] Audit logs remain dense and scannable.
- [ ] Detail modal is clear.
- [ ] Read-only behavior unchanged.
