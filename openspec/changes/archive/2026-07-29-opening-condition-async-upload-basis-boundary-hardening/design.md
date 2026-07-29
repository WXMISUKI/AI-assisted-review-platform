## Context

The agent upload modal currently owns the three selected `File` objects. Closing the modal unmounts `OpeningConditionRealTrialIntakePanel`, so the selection disappears. The same panel awaits upload and bootstrap before invoking `onComplete`, which keeps the modal visible as a blocking "parsing" surface instead of showing the task ledger timeline.

The selected-task and report surfaces already handle duplicate checklist IDs in some lists, but report rectification/finding rows still use backend IDs directly as React keys. Real uploaded checklists can repeat extracted IDs such as `docx-4`, so the report workbench can emit duplicate keys and disturb preview/review rendering.

Backend matching should treat uploaded basis/checklist objects as context and definition inputs. Only material package source objects and their derived packet entries should be evidence candidates for checklist satisfaction.

## Goals / Non-Goals

**Goals:**

- Persist the selected upload draft while the modal is closed, until explicit file removal, page refresh, or successful start.
- Start parsing as an asynchronous UX: close the modal immediately, insert a pending task row, and let the task timeline progress in the detail view.
- Keep failures understandable by removing the optimistic task and surfacing the failure status.
- Make report rectification/finding list keys collision-free without changing backend IDs or report row IDs.
- Filter matching candidates so basis/checklist objects cannot satisfy material checklist evidence.

**Non-Goals:**

- No new backend persistence model for draft files.
- No direct browser-to-provider calls.
- No OCR/PDF deep page splitting, report law-generation, or MaxKB contract changes.
- No construction-plan platform changes.

## Decisions

- Lift the upload draft state to `OpeningConditionObjectOverviewProductizedPage` and pass it into `OpeningConditionRealTrialIntakePanel` as controlled state. This preserves files across modal close without persisting browser `File` objects beyond the page lifetime.
- Add `onBootstrapStart` to the intake panel. It receives the planned task id and filenames after required files are validated, before uploads begin. The agent console closes the modal, clears the draft, and calls App-level pending-task insertion.
- Add an App-level pending task factory. It creates a minimal task with the planned run-specific task id, workspace context, `draft` state, input filenames, and safe timeline events. When the backend bootstrap returns, existing upsert logic replaces that pending task because the task id matches.
- On bootstrap failure, call an App-level failure handler to remove the pending row if it was still optimistic and set the visible platform status.
- Use UI-key helpers for report rows that include row index/sequence alongside backend IDs. Backend IDs remain unchanged for traceability and API routing.
- Harden `buildPacketMatchCandidates` to reject `basis` and `checklist` object kinds and only use packet `sourceObjects` or derived inventory refs.

## Risks / Trade-offs

- [Risk] An optimistic task might briefly show before upload fails. -> Remove it on failure and show the upload error in the platform status.
- [Risk] Controlled file input values cannot be programmatically restored for security reasons. -> Preserve selected file names and state in React; the native input remains selectable and explicit delete controls clear the draft.
- [Risk] Filtering basis/checklist from candidates could reveal missing packet extraction issues. -> This is intended: missing material evidence should go to human review or missing status instead of falsely passing on basis text.
