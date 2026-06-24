# 19 - Admin Questions

## Route va files lien quan

- Route: `/admin/questions`
- View: `Areas/Admin/Views/Questions/Index.cshtml`
- JS: `wwwroot/js/pages/question-list.js`

## Current UI issues

- Dense operational screen needs better hierarchy without large decoration.
- Question editor options need clearer active/correct states.

## Target Linear + Stripe direction

- Premium question bank: compact metrics, dark glass table, refined editor modal.

## Layout redesign

- Small banner/strip, not a large marketing hero.
- Metrics 4 cards.
- Table remains primary.
- Editor modal uses two-column form where possible.

## Typography redesign

- Question text 14-15px in table, 18px in modal detail.
- Badges compact.

## Image plan

- Banner: `question-bank-banner-1600x360.svg`.
- Empty: `empty-question-bank-640x360.svg`.
- No row images; use Lucide type/difficulty icons.

## Interaction plan

- Question row hover.
- Answer option correct state strong but muted.
- Add/remove answer click feedback.

## Animation plan

- Metrics stagger.
- Modal answer rows fade/slide.

## Responsive plan

- Desktop table dense.
- Mobile table wrapper; editor modal stacks.

## i18n safety

- Long question content wraps in modal; table can truncate only with detail action available.

## Acceptance checklist

- [ ] Operational density preserved.
- [ ] Correct answer state clear.
- [ ] No question schema changes.
