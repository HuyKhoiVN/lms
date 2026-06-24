# 03 - Student Material Viewer

## Route va files lien quan

- Route: `/learningmaterials/viewer/{id}`
- View: `Views/LearningMaterials/Viewer.cshtml`
- JS: `wwwroot/js/pages/student-material-viewer.js`

## Current UI issues

- Viewer da co preview nhung can calm reading surface hon.
- Sidebar progress can giong product widget, it decoration gay phan tam.

## Target Linear + Stripe direction

- Reading-focused premium surface: glass card, high contrast text, quiet visuals.
- Sidebar sticky voi progress ring va next actions.

## Layout redesign

- Main viewer 8 cot, sidebar 4 cot.
- Preview frame tren noi dung chi hien neu phu hop content type.
- Text material dung editorial content width 720-780px.

## Typography redesign

- Viewer body 16-17px, line-height 1.75.
- Question/section headings 24px bold.
- Sidebar labels 12-13px uppercase muted.

## Image plan

- Content preview: `material-viewer-1120x630.svg`.
- PDF/File/Link slots: 16:9, contain if document mock.
- No large decorative image inside long text area after first viewport.

## Interaction plan

- Complete button loading state.
- Next action hover lift.
- Toast success glass style.

## Animation plan

- Content card fade in.
- Progress ring grows on load.
- Sidebar actions reveal stagger.

## Responsive plan

- Desktop: 8/4 split.
- Tablet/mobile: sidebar below content; progress summary horizontal if enough width.

## i18n safety

- Long Vietnamese paragraphs must not be constrained by fixed height.
- All fallback copy remains existing i18n.

## Acceptance checklist

- [ ] Reading area feels calm and premium.
- [ ] Sidebar progress clear but not distracting.
- [ ] Content type placeholders are distinct.
