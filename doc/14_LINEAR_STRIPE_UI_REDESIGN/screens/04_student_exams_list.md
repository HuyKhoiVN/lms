# 04 - Student Exams List

## Route va files lien quan

- Route: `/exams`
- View: `Views/Exams/Index.cshtml`
- JS: `wwwroot/js/pages/student-exam-list.js`

## Current UI issues

- Exam cards can be more polished and more clearly status-driven.
- Need stronger image hierarchy without making exams feel like marketing cards.

## Target Linear + Stripe direction

- Assessment hub: premium cards, status clarity, muted exam visuals.
- Dark accent banner but light readable content.

## Layout redesign

- Banner full width with subtle dark glass overlay.
- Card grid 3 cot desktop, each card 16:9 exam visual + metadata.
- Published exams visually elevated; unavailable muted.

## Typography redesign

- Exam title 19-21px.
- Meta line compact, 13-14px.
- Status badge high contrast but muted.

## Image plan

- Banner: `exam-hub-banner-1600x420.svg`.
- Card image: `exam-card-640x360.svg`.
- Empty/loading: `empty-exams-640x360.svg`.

## Interaction plan

- Start button primary with click scale.
- Card hover lift only if exam is actionable.
- Disabled action remains visually quiet.

## Animation plan

- Banner fade in.
- Cards stagger on render.
- Skeleton cards shimmer.

## Responsive plan

- Desktop 3 cot.
- Tablet 2 cot.
- Mobile 1 cot, action full width.

## i18n safety

- Review mode labels wrap in card subtitle.
- Button text min-width not fixed.

## Acceptance checklist

- [ ] Available/unavailable state clear.
- [ ] Card image slot stable.
- [ ] Exam list remains focused.
