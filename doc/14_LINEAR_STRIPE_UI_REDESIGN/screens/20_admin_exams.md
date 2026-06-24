# 20 - Admin Exams

## Route va files lien quan

- Route: `/admin/exams`
- View: `Areas/Admin/Views/Exams/Index.cshtml`
- JS: `wwwroot/js/pages/exam-list.js`

## Current UI issues

- Exam management needs status hierarchy and optional visual identity.
- Publish/assign actions should feel more deliberate.

## Target Linear + Stripe direction

- Assessment operations screen: muted exam banner, compact metric cards, table with exam thumbnails.

## Layout redesign

- Banner 1600x420.
- Metrics 4 cards.
- Table with 96x72 exam visual or icon avatar.

## Typography redesign

- Exam name 14-15px bold.
- Review policy 13px muted.
- Status badges compact.

## Image plan

- Banner: `admin-exams-banner-1600x420.svg`.
- Row thumbnail: `exam-card-640x360.svg` rendered 96x72.
- Empty: `empty-exams-640x360.svg`.

## Interaction plan

- Publish modal glass confirmation.
- Assign modal glass form.
- Row hover and action click scale.

## Animation plan

- Metrics stagger.
- Rows fade.
- Modal scale/fade.

## Responsive plan

- Desktop table.
- Mobile table wrapper or compact exam cards.

## i18n safety

- Review labels may be long; allow wrap in mobile.

## Acceptance checklist

- [ ] Status/action hierarchy clear.
- [ ] Publish/assign modals premium.
- [ ] Exam logic unchanged.
