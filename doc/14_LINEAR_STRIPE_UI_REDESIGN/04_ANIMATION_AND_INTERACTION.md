# Animation And Interaction Plan

## Motion Tokens

- Default duration: 200ms.
- Slow reveal: 360ms.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Hover lift: translateY(-2px to -4px), shadow increase.
- Click press: scale(0.98).
- Focus: visible ring, not color-only.

## Page Load

- Add root page reveal class in layouts.
- Main sections use staggered fade/slide.
- Admin table rows use light fade-in, no excessive delay.
- Auth hero copy and form load asymmetrically.

## Scroll Reveal

- Add IntersectionObserver in `wwwroot/js/core/ui.js`.
- Mark reveal targets with `data-ui-reveal`.
- Default reveal: opacity 0, translateY(16px), blur(4px); active clears transform.
- Reduced motion: reveal immediately, no transform/blur.

## Micro Interactions

- Cards: hover border and shadow.
- Buttons: click scale and loading state.
- Inputs: focus glow, error shake only if subtle and reduced-motion safe.
- Dropdown/modal/toast: glass popover, fade/scale 200ms.
- Progress bars/rings: grow on enter viewport.

## Parallax

- Use only in hero/banner aurora layers and large visual panels.
- Do not use parallax in exam taking or dense admin tables.
- Implement with `requestAnimationFrame` and data attributes, no business logic coupling.

## Reduced Motion

- `@media (prefers-reduced-motion: reduce)` disables transform, parallax, stagger delays, non-essential transitions.
