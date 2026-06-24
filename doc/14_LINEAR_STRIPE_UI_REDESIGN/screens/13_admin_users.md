# 13 - Admin Users

## Route va files lien quan

- Route: `/admin/users`
- View: `Areas/Admin/Views/Users/Index.cshtml`
- JS: `wwwroot/js/pages/user-list.js`

## Current UI issues

- Table-heavy screen can feel static.
- Metric cards and filter bar need premium dark/admin treatment.

## Target Linear + Stripe direction

- Dense but premium user operations screen: compact glass metrics, sticky filters, high-quality avatar/status rows.

## Layout redesign

- Banner/strip 12 columns, low height.
- Metrics 4 columns.
- Filter card full width.
- Table in glass shell with compact row height.

## Typography redesign

- Admin title 36-40px.
- Table primary text 14px bold, secondary 12-13px.
- Button text 13-14px.

## Image plan

- Banner: `admin-users-banner-1600x420.svg`.
- Avatar slot: `avatar-user-160x160.svg`.
- Empty state: `empty-users-640x360.svg`.

## Interaction plan

- Row hover surface.
- Action buttons icon + text.
- Modal create/edit uses glass form sections.

## Animation plan

- Metrics stagger.
- Table rows fade in.
- Modal scale/fade.

## Responsive plan

- Desktop table.
- Tablet horizontal table wrapper.
- Mobile optional compact user cards.

## i18n safety

- Email/user name wraps only in mobile card; table may truncate with tooltip if implemented.
- Status/action labels from i18n.

## Acceptance checklist

- [ ] Users screen remains fast to scan.
- [ ] Avatar/status is visually clear.
- [ ] Modals align with Linear + Stripe style.
