## Context

The platform currently proves the human-in-the-loop review interaction but stops before a formal business output. The product requirements describe two completion paths: supervisors complete review mode and trigger a review report, while contractors or admins in review-revise mode generate a revised plan snapshot. Mature review systems also keep these outputs as task assets instead of treating them as one-off downloads.

## Goals / Non-Goals

**Goals:**
- Add a finish action to the workbench that is disabled until all issues have accepted or rejected decisions.
- Create deterministic mock result assets from current document metadata, issues, decisions, and mode.
- Show a readable result preview after completion.
- Make completed documents in the library expose a result/report entry point.
- Preserve current role/mode behavior and reversible decisions before final confirmation.

**Non-Goals:**
- Do not implement real backend persistence, export files, report-agent LLM calls, or document generation.
- Do not block manual issue creation after completion beyond the current in-memory MVP behavior.
- Do not redesign the overall app shell or theme.

## Decisions

### Decision 1: Generate result assets in the parent app state

`App.tsx` owns document library state, so result assets should live beside document records in the mock model. The review workbench emits a completion payload; the app stores the asset, marks the document completed, and opens a result page.

### Decision 2: Keep reports and revised snapshots as one result type union

Both outputs share metadata, issue decisions, and creation time. A discriminated union allows the UI to render report-specific sections or revised-plan sections while keeping document library entry logic simple.

### Decision 3: Use a result preview page instead of immediate export

The MVP should first validate content structure and navigation. Export can be added later once backend file generation exists.

## Risks / Trade-offs

- [Risk] Mock reports may look too final. -> Mitigation: label the result as mock preview and keep export disabled.
- [Risk] Completion could make reversible issue decisions feel final. -> Mitigation: show a confirmation dialog before generating the result.
- [Risk] Result generation logic can duplicate processed preview logic. -> Mitigation: reuse `buildProcessedParagraphs` for revised-plan snapshots.
