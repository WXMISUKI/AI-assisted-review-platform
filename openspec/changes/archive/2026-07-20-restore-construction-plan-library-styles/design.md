## Context

The construction-plan product now routes through the baseline-derived app flow, but the screenshot shows the document-library body losing important visual affordances. The current `src/styles.css` contains many original classes, so the likely issue is incomplete coverage for the restored component DOM and newer semantic class variants.

## Goals / Non-Goals

**Goals:**

- Restore the document library's upload panel, input controls, file picker, add button, table/list rows, status chips, and action buttons.
- Use semantic tokens and shared selectors so light/dark themes stay consistent.
- Document a stricter process rule for future visual/component changes.
- Keep the implementation minimal and focused on the construction-plan document library.

**Non-Goals:**

- Do not redesign the construction-plan information architecture.
- Do not rewrite the document library component.
- Do not touch backend provider, MaxKB, OCR, or opening-condition workflows.
- Do not introduce a new component library.

## Decisions

### Decision: Fix CSS coverage before changing JSX

Prefer restoring selectors for existing classes (`library-layout`, `library-upload-card`, `upload-form-row`, `table-row`, `row-actions`, `upload-pick-button`) over rewriting the component. This follows the theme guardrail: shared class/token fixes before component-specific patches.

### Decision: Add a style-governance rule to development standards

The user's concern is not just the current bug; it is uncontrolled visual drift. Add an explicit section to `docs/development-standards.md` requiring discussion and OpenSpec before major shell, shared component, or display-style changes.

## Risks / Trade-offs

- CSS rules might affect both construction-plan and legacy workbench surfaces -> scope selectors to existing library classes and token-backed controls.
- Browser-default file inputs are hard to style consistently -> keep the native file input hidden behind the existing styled pick button pattern.
- Existing docs have encoding display issues in some terminals -> write the new section in clean UTF-8 and keep it concise.
