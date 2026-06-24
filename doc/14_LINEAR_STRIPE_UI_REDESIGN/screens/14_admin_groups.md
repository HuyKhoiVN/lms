# 14 - Admin Groups

## Route va files lien quan

- Route: `/admin/groups`
- View: `Areas/Admin/Views/Groups/Index.cshtml`
- JS: `wwwroot/js/pages/group-list.js`

## Current UI issues

- Groups table lacks cohort visual identity.
- Metrics need icon and bento polish.

## Target Linear + Stripe direction

- Cohort management screen with muted collaboration visuals and clear assignment counts.

## Layout redesign

- Banner: cohort/team visual.
- Metrics 4 cards.
- Table rows with group avatar/icon and assignment badges.

## Typography redesign

- Group name bold 14-15px.
- Group id small muted.
- Counts use badges with Lucide icons.

## Image plan

- Banner: `admin-groups-banner-1600x420.svg`.
- Empty: `empty-groups-640x360.svg`.
- Avatar: generated initials in glass circle, optional image slot not required.

## Interaction plan

- Detail button primary-secondary contrast.
- Row hover and action button press.
- Create/edit modal glass sections.

## Animation plan

- Metrics stagger.
- Rows fade in.
- Modal reveal 200ms.

## Responsive plan

- Desktop table.
- Mobile card rows with group stats stacked.

## i18n safety

- Group names and count labels wrap safely.

## Acceptance checklist

- [ ] Cohort visual identity clear.
- [ ] Assignments readable.
- [ ] No group logic changed.
