# 06_UI_COMPONENTS.md

# UI Components & Design System

## Purpose

This document defines the UI design system for lms.

All UI screens must follow these rules.

This document is the single source of truth for:

* Layout
* Components
* Forms
* Tables
* Navigation
* User Experience

---

# 1. Design Philosophy

The provided Figma is treated as:

* Design System
* Component Library
* Visual Reference

The visual style must remain consistent across all screens.

The business flow changes from:

```txt id="z3hb2s"
Learning Platform
```

to

```txt id="k0i9g5"
Learning + Examination Platform
```

---

# 2. UI Technology

Project

```txt id="hvnrgb"
lms.WebMvc
```

Technology

```txt id="dg4foe"
HTML
CSS
jQuery
AJAX
```

No frontend framework.

Do not use:

```txt id="we0a2h"
React
Angular
Vue
Blazor
```

---

# 3. Layout Structure

Every screen uses:

```txt id="k22t8g"
Sidebar
Header
Content Area
Footer
```

Layout

```txt id="qfez8n"
+--------------------------------------+
| Header                               |
+----------+---------------------------+
| Sidebar  |                           |
|          |        Content            |
|          |                           |
+----------+---------------------------+
| Footer                               |
+--------------------------------------+
```

---

# 4. Color Palette

Use colors from Figma.

AI must not invent new theme colors.

Primary Color

```txt id="3nj97m"
# Primary color from Figma
```

Secondary Color

```txt id="4quzqk"
# Secondary color from Figma
```

Status Colors

```txt id="n6mvjl"
Success
Warning
Danger
Info
```

Use consistently.

---

# 5. Typography

Font:

```txt id="kr7p38"
Use Figma font family
```

Hierarchy

```txt id="65dphx"
H1 Page Title
H2 Section Title
H3 Card Title
Body Text
Caption Text
```

Avoid random font sizes.

---

# 6. Core Components

Reusable components must be created once.

---

## Sidebar

Contains navigation menu.

Sections:

```txt id="7xmpf0"
Dashboard

User Management
Group Management

Courses
Learning Materials

Question Bank

Exam Management
Exam Assignment

Results
Certificates

Reports

Audit Logs
```

Support:

```txt id="9i4j95"
Collapse
Expand
Active Menu
```

---

## Header

Contains:

```txt id="yr7vzt"
Logo

Search

Notification

Current User

Profile Menu
```

---

## Page Header

Reusable component.

Contains:

```txt id="zjlm5r"
Page Title
Breadcrumb
Action Buttons
```

Example:

```txt id="z6ebfi"
Question Bank

Dashboard > Question Bank

[Add Question]
```

---

# 7. Card Component

Used everywhere.

Examples:

```txt id="7hfivl"
Dashboard Metrics

Exam Summary

Course Summary

User Summary
```

Structure

```txt id="65gb8n"
Card Header
Card Body
Card Footer
```

---

# 8. Table Component

Standard data table.

Features:

```txt id="x0l4ju"
Pagination
Sorting
Search
Filtering
Responsive
```

Actions:

```txt id="eztj0w"
View
Edit
Delete
Assign
Publish
```

Use icon buttons.

---

# 9. Form Component

Standard form layout.

Structure

```txt id="dtjx1m"
Label

Input

Validation Message
```

Spacing must be consistent.

---

## Input Types

Support

```txt id="djkr1g"
Text
Number
Textarea
Checkbox
Radio
Dropdown
Date
File Upload
```

---

# 10. Modal Component

Reusable modal.

Used for:

```txt id="v8n0bx"
Create
Edit
Confirm
Assign
Delete
```

Sizes

```txt id="dnl9fc"
Small
Medium
Large
```

---

# 11. Toast Notification

Support:

```txt id="kwld5y"
Success
Error
Warning
Info
```

Position

```txt id="9l9px8"
Top Right
```

---

# 12. Dashboard Components

Admin Dashboard

Cards

```txt id="wl42nk"
Total Users
Total Courses
Total Questions
Total Exams
```

Charts

```txt id="xq6o4g"
Pass Rate
Exam Activity
Score Distribution
```

Recent Activity

```txt id="08mn12"
Latest Exams
Latest Users
Latest Results
```

---

# 13. Question Bank Screens

## Question List

Components

```txt id="yx4x6k"
Search
Filter
Data Table
Pagination
```

Actions

```txt id="cok4wj"
Create
Edit
Delete
```

---

## Question Editor

Fields

```txt id="t0rucv"
Category

Difficulty

Question Type

Question Content

Answers

Score
```

Support

```txt id="9nlmv4"
Single Choice
Multiple Choice
```

---

# 14. Exam Builder Screens

This is a critical screen.

Layout

```txt id="t8q4r2"
Exam Information

Exam Configuration

Question Selection

Review Policy
```

Tabs

```txt id="9mukeg"
General

Questions

Assignment

Settings
```

---

## Random Rule Builder

Fields

```txt id="l3hv0t"
Category

Difficulty

Question Count
```

Display summary.

---

# 15. Exam Taking Screen

Most important screen.

Must support:

```txt id="uqvhlm"
Timer

Question Navigator

Question Content

Answer Selection

Previous

Next

Submit
```

Layout

```txt id="hzcljr"
+----------------------+
| Timer                |
+----------------------+

+-----------+----------+
| Navigator | Question |
+-----------+----------+
```

---

## Question Navigator

Display:

```txt id="98ovza"
Question Numbers
```

Status

```txt id="smlfhx"
Answered

Not Answered

Current
```

---

## Timer

Display remaining time.

Must always be visible.

Color changes:

```txt id="zswjdc"
Normal

Warning

Danger
```

when time becomes low.

---

## Submit Confirmation

Before submit:

```txt id="we7cpb"
Show unanswered count
Show confirmation dialog
```

---

# 16. Result Screens

## Result List

Display

```txt id="z3s1ib"
Exam Name
Score
Pass/Fail
Date
```

---

## Result Detail

Display

```txt id="n5e8bg"
Score

Correct Count

Wrong Count

Duration

Review
```

---

# 17. Certificate Screens

Display

```txt id="od31f4"
Certificate Code

Issue Date

Download Button
```

Preview PDF if available.

---

# 18. Reporting Screens

Components

```txt id="6qvz0m"
Filters

Charts

Summary Cards

Export Buttons
```

Charts

```txt id="6mbbrs"
Bar Chart

Line Chart

Pie Chart
```

---

# 19. Audit Log Screens

Display

```txt id="5kj59n"
User

Action

Entity

DateTime
```

Support filtering.

---

# 20. Common UX Rules

Loading

```txt id="oz8uj0"
Show loading spinner
```

Empty State

```txt id="mewngy"
Show friendly message
```

Error State

```txt id="xkw0vv"
Show error component
```

No blank pages.

---

# 21. Responsive Rules

Support:

```txt id="s0kquc"
Desktop
Tablet
Mobile Browser
```

Breakpoints

```txt id="mjlwmh"
>=1200

768-1199

<768
```

Sidebar collapses on smaller screens.

---

# 22. Accessibility

Buttons:

```txt id="a8qylk"
Minimum click area
```

Forms:

```txt id="38jyxd"
Proper labels
```

Color:

```txt id="d4h47r"
Maintain contrast
```

---

# 23. Frontend Folder Structure

```txt id="nk09rq"
wwwroot
│
├── css
│   ├── layout.css
│   ├── components.css
│   ├── pages.css
│   └── utilities.css
│
├── js
│   ├── core
│   │   ├── api-client.js
│   │   ├── auth.js
│   │   ├── ui.js
│   │   └── config.js
│   │
│   └── pages
│       ├── dashboard.js
│       ├── users.js
│       ├── questions.js
│       ├── exams.js
│       ├── exam-taking.js
│       ├── results.js
│       └── reports.js
│
└── images
```

---

# 24. UI Development Rules For AI

Before creating a screen:

1. Reuse existing layout.

2. Reuse existing components.

3. Follow this design system.

4. Do not invent new styles.

5. Do not change color palette.

6. Do not change typography.

7. Keep consistency with Figma.

8. Prioritize usability over visual effects.

9. Exam screens are more important than marketing-style pages.

10. Every screen must work with mock JSON before API integration.

# UI must not be static

Every major screen must include:

- Realistic image or illustration
- Icons
- Hover states
- Active states
- Smooth transitions
- Loading state
- Empty state
- Error state
- Toast notification
- Modal interaction
- Responsive behavior

Cards must have:
- hover transform
- shadow transition
- status badge
- progress animation

Tables must have:
- row hover
- action dropdown or action buttons
- empty state
- loading skeleton

Sidebar must have:
- active menu
- hover state
- collapsible behavior

Exam taking screen must have:
- animated countdown warning
- answered/unanswered question state
- submit confirmation modal
- autosave indicator