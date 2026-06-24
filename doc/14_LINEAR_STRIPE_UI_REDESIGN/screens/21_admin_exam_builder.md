# 21 - Admin Exam Builder

## Route va files lien quan

- Route: `/admin/exams/builder/{id}`
- View: `Areas/Admin/Views/Exams/Builder.cshtml`
- JS: `wwwroot/js/pages/exam-builder-general.js`

## Current UI issues

- Builder is form-heavy and needs clearer workspace hierarchy.
- Tabs need active underline/slide state.

## Target Linear + Stripe direction

- Product builder workspace: sticky tabs, glass panels, clear side summaries.

## Layout redesign

- Sticky builder header/tabs.
- General/settings forms in main 8 cot, summary side 4 cot.
- Questions/assignment panels use 12-column workspace.

## Typography redesign

- Builder title 34-40px.
- Tab text 13-14px bold.
- Form labels 13-14px.

## Image plan

- Optional top strip: `exam-builder-banner-1600x360.svg`.
- Empty next-tab state: `empty-builder-640x360.svg`.
- No large imagery inside active form panels.

## Interaction plan

- Active tab sliding underline.
- Panel transition fade/slide.
- Publish confirmation modal premium.

## Animation plan

- Tab panel transition 200ms.
- Summary values update with subtle pulse.

## Responsive plan

- Desktop split panels.
- Tablet/mobile stack side summary below form.

## i18n safety

- Form labels and help text wrap.
- Do not change save/publish behavior.

## Acceptance checklist

- [ ] Builder feels like a focused product tool.
- [ ] Active tab clear.
- [ ] Form density preserved.
