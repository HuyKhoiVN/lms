# 09 - Student Certificates

## Route va files lien quan

- Route: `/certificates`
- View: `Views/Certificates/Index.cshtml`
- JS: `wwwroot/js/pages/student-certificate-list.js`

## Current UI issues

- Certificate cards need premium print-like preview.
- Modal preview should feel like real certificate mock.

## Target Linear + Stripe direction

- Gallery/masonry certificate layout with editorial certificate frames.
- Modal glass overlay with centered certificate preview.

## Layout redesign

- Metrics 3-col.
- Certificate grid: masonry-like, 3 columns desktop.
- Preview frame uses A4/landscape depending certificate type.

## Typography redesign

- Certificate title 20-24px.
- Meta labels 12px uppercase, values 14-15px.

## Image plan

- Card preview: `certificate-preview-1120x792.svg`.
- Empty state: `empty-certificates-640x360.svg`.
- Modal background same certificate preview asset.

## Interaction plan

- Preview/download buttons with icons.
- Card hover: paper lift + border glow.

## Animation plan

- Certificate cards reveal like gallery.
- Modal scale/fade 200ms.

## Responsive plan

- Desktop 3 columns.
- Tablet 2 columns.
- Mobile 1 column.

## i18n safety

- Certificate code can wrap anywhere.
- Modal copy uses existing i18n.

## Acceptance checklist

- [ ] Certificate preview frame looks premium.
- [ ] Download/preview states clear.
- [ ] Real image replacement requires no layout edits.
