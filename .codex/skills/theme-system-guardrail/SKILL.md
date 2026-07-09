---
name: theme-system-guardrail
description: Use when changing global theme colors, dark/light mode tokens, borders, surfaces, text colors, status/severity chips, or when auditing this project for stray hardcoded colors and inconsistent rendering.
---

# Theme System Guardrail

## Overview

Keep the app on a semantic token system. In this repo, `src/styles.css` is the theme source of truth, and `DESIGN.md` defines the product feel: enterprise, soft dark mode, readable text, subtle borders, no harsh inversion.

## Core Workflow

1. Read `DESIGN.md` and `references/theme-audit.md` before touching colors.
2. Audit the current code for hardcoded hex or rgb literals and component-level white backgrounds.
3. Prefer token changes over one-off selector patches.
4. Normalize surfaces in this order:
   - app shell
   - page panels
   - inputs and buttons
   - pills and chips
   - overlays and dialogs
   - preview/document surfaces
5. For recurring states, map them to theme tokens:
   - severity: critical, high, medium, low
   - status: ready, reviewing, uploaded, failed
6. Verify both themes with screenshots and a quick scan for:
   - unintended white backgrounds in dark mode
   - unreadable dark text on dark surfaces
   - weak borders or separators

## Rules

- Do not fix one component if a root token or shared wrapper can fix the whole family.
- Do not use pure black or pure white as the default theme base.
- Keep dark mode softer than an inverted light theme.
- Keep borders subtle and text contrast readable.
- Put repeated theme logic into variables or shared helpers, not duplicated selectors.

## When In Doubt

- Update the token first.
- Then update the shared class or wrapper.
- Only then add a component-specific override.

