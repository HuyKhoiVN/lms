# 01 - Student Dashboard

## Route va files lien quan

- Route: `/`
- View: `Views/Home/Index.cshtml`
- JS: `wwwroot/js/pages/student-dashboard.js`
- CSS: shared tokens + `pages.css`

## Current UI issues

- Dashboard da co visual cards nhung con thien ve dashboard co ban, chua dat premium editorial feel.
- Hero can nhieu whitespace hon, typography lon hon va visual panel co chieu sau hon.
- Metrics/course cards can bento layout thay vi grid deu don gian.

## Target Linear + Stripe direction

- Light premium learning dashboard voi aurora nen rat nhe.
- Hero editorial 12-column: copy 5 cot, visual/product mock 7 cot.
- Bento dashboard: progress, courses, exams, certificates sap xep bat doi xung.

## Layout redesign

- Hero: `.ui-grid-12`; text `ui-col-5`, visual `ui-col-7`.
- Metrics: bento 4 item, 2 item nho + 1 item rong cho progress.
- Course cards: masonry-like row, first card large 6 cot, cards con lai 3 cot.

## Typography redesign

- H1 56px desktop, 42px tablet, 34px mobile.
- Subtitle 18px, line-height 1.7 de tieng Viet khong chat.
- Metric value 40-48px, label uppercase nho nhung >=12px.

## Image plan

- Hero slot: `hero-learning-1600x900.svg`, render 16:9, 7/12 cot.
- Course card slot: `course-card-640x360.svg`.
- Empty state slot: `empty-state-640x360.svg`.
- Anh hien co chi dung preview, user thay anh that sau.

## Interaction plan

- Course card hover: border alpha tang, image zoom 1.03, lift -3px.
- CTA click scale 0.98.
- Progress cards animate khi visible.

## Animation plan

- Hero copy fade/slide 360ms.
- Bento items stagger 60ms.
- Scroll reveal cho course/exam/certificate sections.
- No parallax on mobile.

## Responsive plan

- Desktop 12 cot.
- Tablet: hero stack visual duoi copy, bento 6 cot.
- Mobile: 1 cot, image height 220px, CTA full width.

## i18n safety

- Khong them text hardcode neu khong co key.
- H1/subtitle cho phep wrap 2-4 dong, khong fixed height.

## Acceptance checklist

- [ ] Hero co premium editorial feel.
- [ ] Course cards co image slot on dinh.
- [ ] VI/EN khong overflow trong metric/card.
- [ ] Scroll reveal ton trong reduced motion.
