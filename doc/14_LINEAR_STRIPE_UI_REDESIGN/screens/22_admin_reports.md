# 22 - Admin Reports

## Route va files lien quan

- Route: `/admin/reports`
- View: `Areas/Admin/Views/Reports/Index.cshtml`
- JS: `wwwroot/js/pages/admin-reports.js`

## Current UI issues

- Reports need stronger analytics dashboard feel.
- Filter card and chart shells need premium polish.

## Target Linear + Stripe direction

- Stripe-like analytics dashboard: dark/glass chart cards, compact filters, gradient accents.

## Layout redesign

- Report banner 1600x420.
- Filter card 12 cot.
- Metrics 4 cards.
- Charts asymmetric grid, large activity chart.

## Typography redesign

- Report title 38-44px.
- Chart titles 18-20px.
- Summary items 14px.

## Image plan

- Banner: `admin-reports-banner-1600x420.svg`.
- Snapshot illustration: `reports-snapshot-640x360.svg`.
- Chart placeholders if Chart.js unavailable.

## Interaction plan

- Filter active state/chips.
- Export buttons with icons.
- Chart card hover border.

## Animation plan

- Metrics stagger.
- Charts fade after render.
- Donut/progress grow.

## Responsive plan

- Desktop chart grid.
- Tablet 2-column.
- Mobile stacked.

## i18n safety

- Filter labels and chart descriptions wrap.

## Acceptance checklist

- [ ] Reports feel like premium analytics.
- [ ] Chart fallback remains usable.
- [ ] Export behavior unchanged.
