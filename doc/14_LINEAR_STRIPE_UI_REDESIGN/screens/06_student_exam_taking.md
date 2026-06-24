# 06 - Student Exam Taking

## Route va files lien quan

- Route: `/exams/take/{id}`
- View: `Views/Exams/Take.cshtml`
- JS: `wwwroot/js/pages/student-exam-taking.js`

## Current UI issues

- Needs premium focus UI but must not add distraction.
- Answer selected/focus/timer warning must be extremely clear.

## Target Linear + Stripe direction

- Dark-light focus shell with sticky timer and clean question panel.
- No decorative images or parallax in main exam area.

## Layout redesign

- Navigator 3 cot, question panel 9 cot desktop.
- Sticky header with glass timer pill.
- Answer options as large touch-friendly rows.

## Typography redesign

- Question content 24-28px desktop, 20-22px mobile.
- Answer text 15-16px, line-height 1.6.
- Timer 28-34px mono-like numeric style.

## Image plan

- No large images.
- Optional tiny status icon only through Lucide.

## Interaction plan

- Answer hover, focus, selected, keyboard focus states.
- Navigator active/answered/marked states.
- Submit modal glass confirmation.

## Animation plan

- Question transition: 160-200ms fade/slide.
- Timer warning pulse only near danger.
- Reduced motion disables question transition.

## Responsive plan

- Desktop side navigator.
- Tablet navigator top grid.
- Mobile navigator horizontal wrap above question.

## i18n safety

- Long question/answer text has no fixed height.
- Do not change timer/autosave/submit logic.

## Acceptance checklist

- [ ] Readability is best among all screens.
- [ ] Timer and submit states clear.
- [ ] No distracting visual effects.
