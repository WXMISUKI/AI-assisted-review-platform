## Why

After restoring the construction-plan product flow, the document library still shows missing component styling: upload inputs, file picker, add button, task rows, and action buttons render too close to browser defaults or lose the original card/list hierarchy. This makes the restored shell feel incomplete and risks future style drift.

## What Changes

- Restore construction-plan document library styling for upload controls, input rows, document list rows, status chips, and row actions.
- Keep the fix scoped to existing component classes and semantic CSS tokens rather than redesigning the page.
- Add a development-standard guardrail: shared components, platform shell structure, and major visual presentation MUST NOT be changed casually; significant visual changes require discussion and an OpenSpec change first.
- Verify the restored library renders with styled controls and list surfaces in the existing Vite app.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-shell`: Construction-plan document library must preserve styled enterprise controls and list row hierarchy when restored from historical baseline.

## Impact

- Affected frontend: `src/styles.css` and, only if needed, minor class alignment in construction-plan page components.
- Affected docs: `docs/development-standards.md`.
- Affected specs: `openspec/specs/platform-shell/spec.md`.
- No backend, provider, OCR, MaxKB, or opening-condition workflow behavior changes.
