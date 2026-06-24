# Layouts And Navigation Plan

## Shared Layout Goals

- Remove Bootstrap CSS/JS from all layouts after replacing dependent classes.
- Add Geist/Inter font loading.
- Add Lucide Icons.
- Add global aurora/noise layers through CSS pseudo-elements, not extra noisy markup.
- Preserve existing i18n attributes and Razor routing.

## Student Layout `_Layout.cshtml`

- Use light premium shell with subtle aurora background and large whitespace.
- Header becomes glass top bar with thin border, backdrop blur, and compact nav pills.
- Search remains visible desktop-first; on tablet/mobile collapses into icon/search row.
- User dropdown uses existing `dropdown.js`, restyled as glass popover.
- Main content max width: 1280px, 12-column aware.
- Footer minimal monochrome.

## Admin Layout `_AdminLayout.cshtml`

- Admin uses premium dark dashboard.
- Sidebar dark glass/ink, thin `#ffffff10` borders, active item with muted gradient accent.
- Header is sticky glass with search, language, notification, user menu.
- Content background: mesh gradient + noise; page content cards remain readable.
- Sidebar collapse keeps icon rail; mobile drawer uses backdrop blur overlay.
- Remove invalid/dead nav links only in implementation if controller route does not exist; otherwise keep route behavior unchanged.

## Auth Layout `_AuthLayout.cshtml`

- Auth pages use split layout: editorial copy + visual panel + form card.
- Background: dark/light aurora gradient depending screen.
- Language switcher becomes floating glass control.
- Login and change password share auth tokens but different composition.

## Bootstrap Removal Checklist

- Replace `.table` with `.app-table`.
- Replace `.d-none` with `.u-hidden` or `.is-hidden`.
- Replace `.visually-hidden` with local utility.
- Replace Bootstrap Icon classes with Lucide icon injection.
- Remove `bootstrap.min.css` and `bootstrap.bundle.min.js` from layouts only after above replacements compile and smoke routes pass.

## Responsive Behavior

- Desktop first: 12-column layout and wide editorial spacing.
- Tablet: collapse 12-column to 6-column or stacked sections.
- Mobile: stacked cards, horizontal overflow avoided, nav drawer, no fixed-width table overflow except intentional table wrapper.
