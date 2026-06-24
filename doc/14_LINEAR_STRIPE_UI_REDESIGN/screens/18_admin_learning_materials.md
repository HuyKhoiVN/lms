# 18 - Admin Learning Materials

## Route va files lien quan

- Route: `/admin/learningmaterials`
- View: `Areas/Admin/Views/LearningMaterials/Index.cshtml`
- JS: `wwwroot/js/pages/learning-material-list.js`

## Current UI issues

- Material rows need visual type identity.
- Create/edit modal should preview content type.

## Target Linear + Stripe direction

- Dense library admin screen with type icons, small thumbnails and glass filter bar.

## Layout redesign

- Banner 1600x420.
- Metrics 4 cards.
- Filter card sticky/elevated.
- Table with type avatar/thumbnail.

## Typography redesign

- Material title 14-15px bold.
- Course name 13px muted.
- Type/status badges 12-13px.

## Image plan

- Banner: `admin-materials-banner-1600x420.svg`.
- Row thumbnail: 96x72.
- Modal preview: 640x360 based on content type.
- Empty: `empty-materials-640x360.svg`.

## Interaction plan

- Type badge hover.
- Row hover.
- Modal preview updates when type changes if feasible.

## Animation plan

- Metrics stagger.
- Rows fade.
- Modal scale/fade.

## Responsive plan

- Desktop table.
- Mobile table wrapper or card rows.

## i18n safety

- Material title and course name wrap in card mode.

## Acceptance checklist

- [ ] Material type obvious at a glance.
- [ ] Modal has preview frame.
- [ ] CRUD mock behavior unchanged.
