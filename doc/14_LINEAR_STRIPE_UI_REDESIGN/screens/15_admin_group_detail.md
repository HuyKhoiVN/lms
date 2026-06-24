# 15 - Admin Group Detail

## Route va files lien quan

- Route: `/admin/groups/detail/{id}`
- View: `Areas/Admin/Views/Groups/Detail.cshtml`
- JS: `wwwroot/js/pages/group-detail.js`

## Current UI issues

- Assignment panels are functional but not visual enough.
- Empty states for members/courses/exams need illustration.

## Target Linear + Stripe direction

- Group command center: cohort banner, metric bento, three assignment panels as glass cards.

## Layout redesign

- Banner full width.
- Metrics 4 cards.
- Three panels in grid: members 6 cot, courses 3 cot, exams 3 cot if space allows; otherwise 3 equal cards.

## Typography redesign

- Group title 40px.
- Panel title 18-20px.
- Assignment item title 14-15px.

## Image plan

- Banner: `group-detail-banner-1600x420.svg`.
- Empty members/courses/exams: distinct 640x360 placeholders.

## Interaction plan

- Add controls focus glow.
- Assignment item hover.
- Remove action click feedback and danger hover.

## Animation plan

- Metrics stagger.
- Panels reveal by column.
- Added item can fade in if implementation budget allows.

## Responsive plan

- Desktop grid.
- Tablet 2/1 layout.
- Mobile all panels stack.

## i18n safety

- Count badges and names wrap.
- Avoid hardcoded "members/courses/exams" labels outside i18n.

## Acceptance checklist

- [ ] Group detail feels like a management workspace.
- [ ] Empty states are visual.
- [ ] Add/remove behavior unchanged.
