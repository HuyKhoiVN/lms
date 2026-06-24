# 07 - Student Results List

## Route va files lien quan

- Route: `/results`
- View: `Views/Results/Index.cshtml`
- JS: `wwwroot/js/pages/student-result-list.js`

## Current UI issues

- Results table is functional but can use stronger score/status visual system.
- Need responsive card mode planning.

## Target Linear + Stripe direction

- Performance dashboard with calm score metrics, result history table, muted pass/fail accents.

## Layout redesign

- Top banner 1600x420.
- Metric bento row.
- Table desktop; mobile transforms to result cards if implementation budget allows.

## Typography redesign

- Metric values 40px.
- Table exam name 14-15px bold.
- Status text never color-only.

## Image plan

- Banner: `results-banner-1600x420.svg`.
- Empty state: `empty-results-640x360.svg`.
- Optional tiny exam visual 96x72 in mobile cards.

## Interaction plan

- Row hover + detail button hover.
- Filter active chips optional.

## Animation plan

- Metrics count/reveal.
- Table rows fade in with short stagger.

## Responsive plan

- Desktop table.
- Mobile: table wrapper or card mode; prefer card mode if feasible.

## i18n safety

- Date/time columns allow nowrap only where safe; otherwise wrap on mobile.

## Acceptance checklist

- [ ] Pass/fail state clear.
- [ ] Mobile remains usable.
- [ ] Result detail path unchanged.
