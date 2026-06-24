# 10 - Auth Login

## Route va files lien quan

- Route: `/auth/login`
- View: `Views/Auth/Login.cshtml`
- JS: `wwwroot/js/pages/login.js`
- Layout: `_AuthLayout.cshtml`

## Current UI issues

- Login has split layout but needs stronger Stripe/Linear editorial composition.
- Need remove Bootstrap and Bootstrap Icons dependency later.

## Target Linear + Stripe direction

- Asymmetric auth landing: large editorial headline, product visual, glass form card.

## Layout redesign

- Desktop 12-column: visual/copy 7 cot, form 5 cot.
- Auth visual panel has aurora/mesh background and floating dashboard cards.
- Form card glass light with thin border.

## Typography redesign

- Hero title 56-72px desktop.
- Form title 30-36px.
- Body 16px line-height 1.65.

## Image plan

- Hero visual: `auth-hero-1280x960.svg`.
- Floating card mock: `auth-dashboard-card-640x360.svg`.
- No required real photo.

## Interaction plan

- Demo account cards active state.
- Input focus glow.
- Submit loading state.
- Error toast glass style.

## Animation plan

- Hero copy slide in.
- Floating cards subtle y motion/parallax.
- Form card fade/scale.

## Responsive plan

- Desktop split.
- Tablet visual top, form bottom.
- Mobile hide secondary floating cards; keep one visual banner.

## i18n safety

- Hero title can wrap up to 4 lines.
- Form labels from i18n only.

## Acceptance checklist

- [ ] Login feels premium and trustworthy.
- [ ] Vietnamese text readable.
- [ ] Login logic unchanged.
