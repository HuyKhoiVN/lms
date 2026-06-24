# 16 - Admin Courses

## Route va files lien quan

- Route: `/admin/courses`
- View: `Areas/Admin/Views/Courses/Index.cshtml`
- JS: `wwwroot/js/pages/course-list.js`

## Current UI issues

- Course catalog should use larger imagery and premium card design.
- Table view needs thumbnails and animated progress.

## Target Linear + Stripe direction

- Premium catalog operations: visual course cards + dense operational table.

## Layout redesign

- Banner full width.
- Metrics 4 cards.
- Course catalog bento: first card can span 6 cot, others 3 cot.
- Table below with thumbnail column.

## Typography redesign

- Course card title 20px.
- Description 14px, max 3 lines.
- Table title 14px bold.

## Image plan

- Banner: `admin-courses-banner-1600x420.svg`.
- Card image: `course-card-640x360.svg`.
- Table thumbnail: 160x120.
- Empty: `empty-courses-640x360.svg`.

## Interaction plan

- Card hover image zoom.
- Progress bar grows on reveal.
- Assign/edit/detail buttons use icons.

## Animation plan

- Catalog cards stagger.
- Table rows fade.
- Progress grow 360ms.

## Responsive plan

- Desktop catalog + table.
- Tablet 2-col cards.
- Mobile 1-col cards and scroll table.

## i18n safety

- Course title/description clamp should not hide essential Vietnamese text unless tooltip/detail remains available.

## Acceptance checklist

- [ ] Course cards use image slots consistently.
- [ ] Table remains operational.
- [ ] Progress animation not distracting.
