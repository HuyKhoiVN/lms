# 17 - Admin Course Detail

## Route va files lien quan

- Route: `/admin/courses/detail/{id}`
- View: `Areas/Admin/Views/Courses/Detail.cshtml`
- JS: `wwwroot/js/pages/course-detail.js`

## Current UI issues

- Course detail needs stronger hero/banner and clearer section hierarchy.
- Material/user/group lists need visual state.

## Target Linear + Stripe direction

- Course profile page: large banner, course hero card, sticky side summary.

## Layout redesign

- Banner full width.
- Metrics 4 cards.
- Main content 8 cot, side assignments 4 cot.
- Course hero uses image 320x180 + code/progress.

## Typography redesign

- Course title 32-40px in hero.
- Material item title 14-15px.
- Summary values bold.

## Image plan

- Banner: `course-detail-banner-1600x420.svg`.
- Course hero image: `course-card-640x360.svg`.
- Empty material/user/group illustrations.

## Interaction plan

- Publish button loading/active state.
- Material items hover.
- Assignment items hover and action feedback.

## Animation plan

- Hero reveal.
- Metrics stagger.
- Progress grow.

## Responsive plan

- Desktop 8/4.
- Mobile side cards below main.

## i18n safety

- Long descriptions wrap; avoid fixed hero height.

## Acceptance checklist

- [ ] Course identity is visually obvious.
- [ ] Lists are scannable.
- [ ] Publish logic unchanged.
