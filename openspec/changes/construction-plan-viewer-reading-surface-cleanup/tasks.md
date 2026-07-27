## 1. Specification

- [x] 1.1 Create proposal, design, modified workbench spec, and task list.
- [x] 1.2 Confirm this change is frontend-only and preserves internal recovered-structure compatibility.

## 2. Viewer Context Fix

- [x] 2.1 Clear stale `activeIssueId` when a viewer selection draft is captured.
- [x] 2.2 Remove automatic issue-card scrolling after viewer-side manual issue creation.
- [x] 2.3 Keep the new manual issue active after creation without moving the source viewer.

## 3. Reading Surface Cleanup

- [x] 3.1 Remove the paragraph fallback/debug view from the detail page.
- [x] 3.2 Remove the heuristic chapter outline panel from the detail page.
- [x] 3.3 Reflow the detail page into a two-column viewer and issue-list layout.
- [x] 3.4 Keep recovered structure and paragraph data available to internal review flows.

## 4. Verification

- [x] 4.1 Run `pnpm typecheck`.
- [ ] 4.2 Run `openspec validate construction-plan-viewer-reading-surface-cleanup`.
- [ ] 4.3 Manually verify selection, manual issue creation, issue focus, and legacy task reopening.

## 5. Archive

- [x] 5.1 Record implementation outcome and known MVP trade-offs.
- [ ] 5.2 Archive the change and sync the modified workbench spec.
