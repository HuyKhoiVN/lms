# 02 - Student Materials List

## Route va files lien quan

- Route: `/learningmaterials`
- View: `Views/LearningMaterials/Index.cshtml`
- JS: `wwwroot/js/pages/student-material-list.js`

## Current UI issues

- Filter va card list con giong admin list, chua du cam giac discovery.
- Image usage can ro hon theo loai PDF/Text/File/Link.

## Target Linear + Stripe direction

- Learning library co banner editorial, filter glass bar va card grid rong rai.
- Moi material card co visual type frame, icon Lucide va subtle status.

## Layout redesign

- Top banner 12 cot full width.
- Filter bar sticky trong section, glass light, 12-column control layout.
- Material grid: desktop 3 cot, first featured item co the span 2 cot neu co du lieu.

## Typography redesign

- Page title 44px.
- Card title 18-20px, max 3 dong.
- Metadata 13px, muted, line-height 1.5.

## Image plan

- Banner: `material-library-banner-1600x420.svg`.
- Card slot: `material-card-640x360.svg`.
- Type placeholders: `material-pdf-640x360.svg`, `material-text-640x360.svg`, `material-link-640x360.svg`.

## Interaction plan

- Filter focus glow.
- Card hover image zoom + action button reveal.
- Type badge hover remains subtle, no saturated colors.

## Animation plan

- Banner reveal on load.
- Cards scroll reveal stagger by row.
- Filter bar no parallax.

## Responsive plan

- Desktop 3-col cards.
- Tablet 2-col.
- Mobile 1-col, filters stacked.

## i18n safety

- Material title/description wraps naturally.
- Placeholder text in search remains i18n-driven.

## Acceptance checklist

- [ ] Library visually rich but scannable.
- [ ] All cards reserve 16:9 image space.
- [ ] Empty/loading states use illustration.
