# Theme Audit Reference

## Source of Truth

- `src/styles.css`
- `DESIGN.md`

## Theme Tokens

Use semantic roles, not raw hex in components:

- `--page-bg`
- `--surface`
- `--surface-muted`
- `--border`
- `--border-soft`
- `--ink`
- `--ink-muted`
- `--ink-subtle`
- `--text-primary`
- `--text-secondary`
- `--text-tertiary`
- `--text-on-accent`
- `--primary`
- `--primary-soft`
- `--severity-*`
- `--status-*`

## Audit Checklist

1. Search for literals:
   - `rg -n "#[0-9a-fA-F]{3,8}|rgb\\(" src/styles.css src/App.tsx src/ReviewWorkbenchPage.tsx`
2. Prefer token or wrapper updates over local overrides.
3. Check these surfaces in both themes:
   - login
   - library
   - loading
   - detail workspace
   - preview pane
   - popovers and dialogs
4. Confirm there is no unintended:
   - white panel in dark mode
   - black text on dark surfaces
   - borderless floating card that breaks hierarchy

## Preferred Fix Order

1. Root token
2. Shared component class
3. Page-level wrapper
4. Component-specific override

