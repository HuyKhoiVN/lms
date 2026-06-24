# Linear + Stripe UI Redesign - Overview

## Muc tieu

Redesign UI cua `lms.WebMvc` theo phong cach Linear + Stripe: premium SaaS, typography-first, nhieu whitespace, bo cuc 12 cot, glassmorphism nhe, aurora/mesh gradient, shadow mem va animation 200ms.

Bo tai lieu nay chi la plan. Khong sua route, controller, API contract, mock schema, business logic hoac i18n JSON trong buoc lap plan.

## Pham vi

- Project scope: `src/lms/lms.WebMvc`.
- Layout scope: `_Layout.cshtml`, `_AdminLayout.cshtml`, `_AuthLayout.cshtml`.
- Style scope: `site.css`, `layout.css`, `components.css`, `animations.css`, `pages.css`, `utilities.css`.
- Interaction scope: jQuery + JS hien co trong `wwwroot/js/core` va `wwwroot/js/pages`.
- Screen scope: tat ca man user, auth va admin duoc liet ke trong folder `screens/`.

## Nguyen tac Linear + Stripe

- Premium SaaS: it mau sac, nhieu khoang trong, card ro hierarchy, CTA ro nhung khong choi.
- Typography la trong tam: title lon, bold, line-height rong cho tieng Viet, text khong bi cat.
- Neutral palette: monochrome, dark ink, muted blue/teal/violet accents, khong dung mau qua bao hoa.
- Border mong: dark surface dung `#ffffff10`; light surface dung border alpha tuong duong.
- Glass nhe: surface co alpha, backdrop blur, noise texture, khong lam giam contrast.
- Layout hien dai: 12-column grid, bento grid, masonry/asymmetric khi phu hop.
- Motion tinh te: 200ms, scroll reveal, hover lift nhe, click scale nhe, reduced motion.

## Quy tac an toan

- Khong hardcode text moi neu co the dung i18n key san co.
- Neu can them text moi khi implement, tao task i18n rieng, khong chen truc tiep vao JSON trong UI refactor.
- Khong dung Bootstrap sau redesign: go CSS/JS Bootstrap khoi layout va thay class phu thuoc bang local utilities.
- Khong phu thuoc anh that. Moi image slot phai co aspect-ratio, placeholder, label kich thuoc.
- Man exam taking uu tien readability va focus, khong them anh lon hoac parallax gay mat tap trung.

## Deliverables

- 6 file nen tang trong folder nay.
- 23 file screen plan trong `screens/`.
- Moi screen file phai co day du: route/files, current issues, target direction, layout, typography, image, interaction, animation, responsive, i18n safety, acceptance checklist.
