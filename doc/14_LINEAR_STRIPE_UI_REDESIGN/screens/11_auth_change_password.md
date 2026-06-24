# 11 - Auth Change Password

## Route va files lien quan

- Route: `/auth/changepassword`
- View: `Views/Auth/ChangePassword.cshtml`
- JS: `wwwroot/js/pages/change-password.js`

## Current UI issues

- Form is functional but not visually aligned with premium auth flow.
- Password rules can be clearer and more visual.

## Target Linear + Stripe direction

- Secure account form with glass card, security illustration, strength/rules panel.

## Layout redesign

- 12-column: form 7 cot, rules/security panel 5 cot.
- Security panel includes image slot and rule cards.

## Typography redesign

- Page title 40-48px.
- Field labels 14-15px bold.
- Rule text 14px line-height 1.6.

## Image plan

- Security visual: `auth-security-640x360.svg`.
- Optional tiny shield icon through Lucide.

## Interaction plan

- Input focus glow.
- Submit loading.
- Rule validation states if existing JS allows without business changes.

## Animation plan

- Form and rules reveal side-by-side.
- Rule cards stagger.

## Responsive plan

- Desktop 7/5.
- Mobile rules below form.

## i18n safety

- Error messages keep current i18n/fallback.
- Do not shorten Vietnamese validation text by fixed width.

## Acceptance checklist

- [ ] Form feels secure and polished.
- [ ] Rules are visible and understandable.
- [ ] Password logic unchanged.
