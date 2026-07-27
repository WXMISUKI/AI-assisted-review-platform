## Context

The previous viewer annotation MVP added a source-faithful DOCX viewer, issue focus, and viewer-side text selection. The page still contains two legacy interactions:

- a paragraph-rendered fallback surface with scroll-driven active paragraph synchronization
- a heuristic chapter outline built from recovered paragraph sections

The screenshot confirms the viewer itself is rendering correctly. The remaining user-visible defect is caused by state ownership: a viewer selection draft is written with the old `activeIssueId`, and subsequent task/session updates can rehydrate that old issue. The manual issue creation path also explicitly scrolls the issue card rail, which is undesirable when the user is working in the source viewer.

## Goals / Non-Goals

**Goals**

- Keep the viewer selection location stable from selection through manual issue creation.
- Prevent draft selection state from selecting or restoring an unrelated previous issue.
- Remove UI surfaces that do not preserve source layout or provide reliable navigation.
- Keep the existing issue list, decision actions, backend persistence, and viewer annotations working.
- Keep the internal recovered structure contract intact for review generation and legacy tasks.

**Non-Goals**

- Do not redesign the viewer rendering engine.
- Do not implement a native Word outline, bookmarks, or exact DOCX heading navigation.
- Do not remove recovered structure from task payloads or backend APIs.
- Do not migrate existing persisted issues.
- Do not add PDF, canvas, or external editor dependencies.

## Decisions

1. Treat viewer selection draft as a neutral focus state.
   - While a selection is being edited, persist section/paragraph context only and clear `activeIssueId`.
   - The newly created manual issue becomes active only after creation.
   - Alternative rejected: keep the previous issue active during drafting. This is the direct source of stale re-focus.

2. Remove the issue-card auto-scroll after manual creation.
   - The viewer is the primary source of truth, and the user should remain at the selected source location.
   - The new issue card can still be highlighted through `activeIssueId`.
   - Alternative rejected: scroll the right rail automatically. It changes the page viewport away from the user’s selection.

3. Remove the paragraph fallback and heuristic chapter outline from the detail UI.
   - The current parser creates `RecoveredDocumentSection` values from heading-style and regex heuristics; it does not expose a durable Word navigation tree.
   - `docx-preview` renders a page-like document surface but is not used here as a trustworthy outline provider.
   - Alternative rejected: add another heuristic layer on top of the existing heuristic output. It would increase apparent complexity without improving trust.

4. Use a two-column layout for the detail page.
   - Main column: source-faithful viewer and manual annotation surface.
   - Side column: issue list and decisions.
   - The recovered data stays in memory and persistence but is no longer a visible navigation dependency.

## Risks / Trade-offs

- [Risk] Users lose quick chapter navigation from the left panel.
  - Mitigation: the viewer remains page-scrollable and issue cards remain direct navigation anchors.

- [Risk] Some older tasks rely on paragraph UI for diagnosis.
  - Mitigation: paragraph data and anchors remain in the task/session contract; only the detail-page rendering is removed.

- [Risk] Clearing active issue during draft may make the summary temporarily show no active issue.
  - Mitigation: show a selection-draft state in the manual selection banner and restore the new issue as active on submit.

## Migration Plan

1. Deploy frontend-only changes.
2. Existing task/session payloads continue to load because no persisted fields are removed.
3. If manual selection UX regresses, revert the detail-page UI change without data migration.

## Open Questions

- A durable Word-native outline can be revisited after the MVP if users require chapter navigation. That should be a separate change based on explicit document samples and acceptance criteria.
