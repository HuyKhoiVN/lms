# 08 - Student Result Detail

## Route va files lien quan

- Route: `/results/detail/{id}`
- View: `Views/Results/Detail.cshtml`
- JS: `wwwroot/js/pages/student-result-detail.js`

## Current UI issues

- Score ring exists but can feel more premium.
- Review cards need refined hierarchy and state styling.

## Target Linear + Stripe direction

- Score hero with large ring, muted status, sticky summary and review cards.

## Layout redesign

- Score hero full width using 12-column: score 3 cot, copy 6 cot, visual 3 cot.
- Detail layout: sticky summary 4 cot, review 8 cot.

## Typography redesign

- Score 42-56px.
- Review question 18-20px bold.
- Answer text 14-15px.

## Image plan

- Small result visual: `result-visual-320x180.svg`.
- Locked/empty review: `empty-results-640x360.svg`.

## Interaction plan

- Review card hover border only.
- Correct/wrong/selected badges with Lucide icons.

## Animation plan

- Score ring grows on reveal.
- Review cards stagger.

## Responsive plan

- Summary stacks above review on mobile.
- Score hero becomes vertical center.

## i18n safety

- Policy copy wraps naturally.
- Long answers preserve spacing.

## Acceptance checklist

- [ ] Score/result status understood in 3 seconds.
- [ ] Review policy respected.
- [ ] No answer logic changed.
