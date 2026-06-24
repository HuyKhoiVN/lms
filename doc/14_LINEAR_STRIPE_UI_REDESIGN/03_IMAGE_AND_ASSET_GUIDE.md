# Image And Asset Guide

## Asset Folders

Create during implementation:

- `wwwroot/images/placeholders/linear-stripe/`
- `wwwroot/images/backgrounds/linear-stripe/`
- `wwwroot/images/noise/`

Existing images in `wwwroot/images` are references only. Use them only to preview composition. Final design must keep mock image frames so real images can replace files later.

## Image Slot Naming

- `hero-learning-1600x900.svg`
- `hero-auth-1280x960.svg`
- `banner-admin-1600x420.svg`
- `course-card-640x360.svg`
- `exam-card-640x360.svg`
- `material-card-640x360.svg`
- `certificate-preview-1120x792.svg`
- `empty-state-640x360.svg`
- `avatar-user-160x160.svg`

## Required Slot Sizes

- Hero: 16:9, min 640x360, desktop can fill 7/12 columns.
- Banner: 1600x420, height 220-280 desktop, 160-190 tablet/mobile.
- Card image: 640x360, 16:9.
- Small thumbnail: 160x120 or 96x72.
- Certificate preview: 4:3 or A4-inspired, 1120x792 or 794x1123 depending screen.
- Avatar: square 160x160 source, rendered 40/48/64.

## Visual Direction

- Linear/Stripe style prefers abstract product-like visuals, soft 3D panels, dashboards, learning screenshots, certificate mockups.
- Avoid generic stock photos as final default. If photo slot is needed, use overlay and crop guide.
- Each screen plan must list exact image slots with purpose and size.

## Implementation Rules

- Every image slot uses `aspect-ratio`.
- Every image uses `object-fit: cover` or `contain` based on purpose.
- Add subtle gradient overlay only when text is on top.
- Empty/loading states use illustration slots, not text-only blocks.
- Avoid layout shift before images load.
