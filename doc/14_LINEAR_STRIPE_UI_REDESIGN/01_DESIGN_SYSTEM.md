# Design System - Linear + Stripe

## Typography

- Primary font: `Geist`.
- Fallback: `Inter`, `"Segoe UI"`, `"Noto Sans"`, Arial, sans-serif.
- Body user/auth: 15-16px, line-height 1.65.
- Body admin: 14-15px, line-height 1.55.
- Page title: 44-56px for user/auth hero, 32-40px for admin page title.
- Card title: 18-22px, font-weight 700-800.
- Table text: 13-14px, line-height 1.5, no text below 12px except metadata.
- Vietnamese safety: use `overflow-wrap: anywhere`, avoid fixed height for text blocks, keep button min-height instead of fixed height.

## Color Tokens

- Dark base: `#08090c`, `#0b0d12`, `#111318`.
- Light base: `#f7f8fb`, `#ffffff`, `#f3f5f8`.
- Text dark theme: primary `#f7f8ff`, secondary `#a6adbb`, muted `#747b8a`.
- Text light theme: primary `#111318`, secondary `#5f6675`, muted `#8b93a3`.
- Accent gradient: blue/violet/teal, muted opacity only.
- Border dark: `#ffffff10`; hover border: `#ffffff20`.
- Border light: `rgba(15, 23, 42, 0.08)`; hover border: `rgba(15, 23, 42, 0.14)`.

## Surface Tokens

- `--surface-glass-dark`: `rgba(255,255,255,0.06)`.
- `--surface-glass-light`: `rgba(255,255,255,0.68)`.
- `--blur-glass`: `blur(20px)`.
- `--shadow-soft`: `0 18px 60px rgba(0,0,0,0.18)`.
- `--shadow-card`: `0 12px 40px rgba(8,9,12,0.10)`.
- `--radius-card`: 18-24px for premium surfaces.
- `--radius-control`: 12-14px.

## Grid And Layout

- Add `.ui-grid-12`: `display:grid; grid-template-columns: repeat(12, minmax(0,1fr)); gap: 24px`.
- Add `.ui-col-3`, `.ui-col-4`, `.ui-col-5`, `.ui-col-6`, `.ui-col-7`, `.ui-col-8`, `.ui-col-9`, `.ui-col-12`.
- Add `.bento-grid`: asymmetric dashboard/card layout.
- Add `.masonry-grid`: CSS columns or grid-auto placement for certificate/course/report visual lists.
- Desktop-first: optimize 1200-1440px first, then tablet and mobile.

## Components

- Card: glass background, thin border, soft shadow, 200ms hover transform.
- Button: monochrome base, accent primary, click scale 0.98, focus ring visible.
- Input/select: dark/light glass variant, high contrast, no Bootstrap dependency.
- Table: dense rows, hover surface, sticky filter card when useful.
- Badge: muted filled/outline style, no saturated status color.
- Image slot: fixed aspect-ratio, gradient overlay, label hidden or subtle, object-fit cover.

## Icons

- Use Lucide Icons.
- Load via CDN script or local bundle in layout.
- Replace Bootstrap Icons progressively.
- Icon size: 16px in tables/buttons, 20px in card headers, 28-36px in metric icons.
