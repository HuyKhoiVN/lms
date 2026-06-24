# 12 - Admin Dashboard

## Route va files lien quan

- Route: `/admin`
- View: `Areas/Admin/Views/Dashboard/Index.cshtml`
- JS: `wwwroot/js/pages/admin-dashboard.js`

## Current UI issues

- Admin dashboard has metrics/charts but needs stronger premium dark dashboard identity.
- Charts need consistent glass shells and loading skeletons.

## Target Linear + Stripe direction

- Premium dark operating dashboard: aurora background, bento metrics, glass chart cards.

## Layout redesign

- Hero/banner 12 columns.
- Metrics as bento row.
- Charts in asymmetric grid: pass rate 4 cot, activity 5 cot, distribution 3 cot or similar.

## Typography redesign

- Page title 36-44px.
- Metric values 40px.
- Chart titles 18-20px.

## Image plan

- Admin banner: `admin-dashboard-banner-1600x420.svg`.
- Optional floating dashboard visual in banner.

## Interaction plan

- Metric hover lift.
- Chart card hover border.
- Recent activity row hover with status icon.

## Animation plan

- Metrics stagger.
- Charts fade after data render.
- Progress/donut grows on reveal.

## Responsive plan

- Desktop bento.
- Tablet charts stack 2/1.
- Mobile all stack.

## i18n safety

- Chart labels not fixed width.
- Activity descriptions wrap.

## Acceptance checklist

- [ ] Dashboard clearly dark premium.
- [ ] Charts readable.
- [ ] Admin remains scannable.
