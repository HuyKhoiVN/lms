# 05 - Student Exam Start

## Route va files lien quan

- Route: `/exams/start/{id}`
- View: `Views/Exams/Start.cshtml`
- JS: `wwwroot/js/pages/student-exam-start.js`

## Current UI issues

- Summary/rules can feel more premium and preparatory.
- Needs strong CTA hierarchy without visual noise.

## Target Linear + Stripe direction

- Focused pre-exam screen: quiet gradient, large exam title, stat chips, rules as glass checklist.

## Layout redesign

- Main summary 8 cot, rules 4 cot.
- Top exam banner 16:9 or 1600x420 but low contrast.
- Stat chips in 2x2 grid.

## Typography redesign

- Exam title 44px if in page hero.
- Stat values 28-34px.
- Rules text 14-15px with line-height 1.6.

## Image plan

- Banner: `exam-start-banner-1600x420.svg`.
- No extra card images beyond banner.

## Interaction plan

- Start button primary, loading state.
- Rule cards hover border only, no lift that suggests clickable if not clickable.

## Animation plan

- Banner + summary load first.
- Rules stagger 60ms.

## Responsive plan

- Desktop 8/4.
- Mobile rules under summary, CTA sticky bottom optional.

## i18n safety

- Rule text can wrap 3-5 lines.
- Do not add new rule copy in UI refactor.

## Acceptance checklist

- [ ] Start action unmistakable.
- [ ] Rules clear and readable.
- [ ] No business logic changed.
