---
name: theme-system-guardrail
description: Use when changing global theme colors, dark/light mode tokens, borders, surfaces, text colors, status/severity chips, or when auditing this project for stray hardcoded colors and inconsistent rendering.
---

# Theme System Guardrail

## Overview

Keep the app on a semantic token system. In this repo, `src/styles.css` is the theme source of truth, and `DESIGN.md` defines the product feel: enterprise, soft dark mode, readable text, subtle borders, no harsh inversion.

For external style inspiration, use `D:\work\tools\awesome-design-md\README.md` as the catalog guide and consult matching `design-md/<brand>/README.md` files when you need to borrow a layout, depth, button, or motion pattern. Treat these as reference material only: extract the design principle, then map it back into this repo's tokens.

## Core Workflow

1. Read `DESIGN.md` and `references/theme-audit.md` before touching colors.
2. Read `D:\work\tools\awesome-design-md\README.md` when you need a broader style reference, then choose one or more matching style READMEs for the current surface.
3. Audit the current code for hardcoded hex or rgb literals and component-level white backgrounds.
4. Prefer token changes over one-off selector patches.
5. Normalize surfaces in this order:
   - app shell
   - page panels
   - inputs and buttons
   - pills and chips
   - overlays and dialogs
   - preview/document surfaces
6. For recurring states, map them to theme tokens:
   - severity: critical, high, medium, low
   - status: ready, reviewing, uploaded, failed
7. Verify both themes with screenshots and a quick scan for:
   - unintended white backgrounds in dark mode
   - unreadable dark text on dark surfaces
   - weak borders or separators

## Rules

- Do not fix one component if a root token or shared wrapper can fix the whole family.
- Do not use pure black or pure white as the default theme base.
- Keep dark mode softer than an inverted light theme.
- Keep borders subtle and text contrast readable.
- Put repeated theme logic into variables or shared helpers, not duplicated selectors.
- Keep login page motion restrained: slow drift, soft glow, and subtle layered gradients are fine; avoid noisy particle fields or high-contrast animated backgrounds.
- Buttons need semantic treatment too: primary, secondary, danger, and icon buttons should each have token-backed background, border, and foreground colors in both themes.

## When In Doubt

- Update the token first.
- Then update the shared class or wrapper.
- Only then add a component-specific override.
