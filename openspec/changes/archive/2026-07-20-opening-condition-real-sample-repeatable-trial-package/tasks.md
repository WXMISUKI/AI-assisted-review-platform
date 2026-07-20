## 1. Backend Trial Package Model

- [x] 1.1 Add optional trial package and report diagnostics types to frontend domain contracts.
- [x] 1.2 Add backend normalization and derivation helpers for task-owned trial package summaries.
- [x] 1.3 Update intake, match, human-review decision, report generation, and archive mutations to refresh trial package summaries.
- [x] 1.4 Add backend regression tests for trial package diagnostics, archived immutability, and secret redaction.

## 2. Real Intake Diagnostics

- [x] 2.1 Return bounded checklist-definition and packet manifest diagnostics from real trial bootstrap and intake responses.
- [x] 2.2 Preserve safe input filenames and manifest sample names for browser-uploaded real files.
- [x] 2.3 Add fallback diagnostics for unresolved checklist adaptation and ZIP manifest extraction failure.

## 3. Frontend Operator Rendering

- [x] 3.1 Extend typed API client results to include trial package and report diagnostics.
- [x] 3.2 Render real-sample intake diagnostics on the material-intake page without changing the portal information architecture.
- [x] 3.3 Render backend trial package and report package summaries on material-check, human-review, and report pages.
- [x] 3.4 Ensure archived tasks disable report generation and hide archive action while still showing the package.

## 4. Runbook and Operator Handoff

- [x] 4.1 Update the real-sample trial runbook with exact frontend steps and expected status messages.
- [x] 4.2 Add a concise issue-capture checklist for the operator to report provider, checklist, manifest, human-review, and report blockers.

## 5. Verification

- [x] 5.1 Run targeted backend tests for opening-condition pilot store.
- [x] 5.2 Run TypeScript typecheck.
- [x] 5.3 Run a local smoke flow through intake, match, human-review, report, archive, and archived report-regeneration rejection.
- [x] 5.4 Validate the OpenSpec change.
