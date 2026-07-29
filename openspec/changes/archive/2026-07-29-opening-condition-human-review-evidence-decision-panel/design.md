## Context

The selected-task workbench already renders review mode as a full `opening-agent-detail` replacement. It also has reason text, content-fact diagnostics, and decision buttons. What remains weak is the operator's bridge between the item, its linked evidence, and the decision state: the user can see a preview, but not a compact checklist of the evidence records and the current ledger state.

## Goals / Non-Goals

**Goals:**

- Show linked evidence records in the decision pane with file name, locator, confidence, extracted summary, and master-data references when available.
- Show a decision-ledger status panel that distinguishes "needs decision", "deferred", "decided", and "not actionable".
- Explain why decision buttons are disabled when the current item has no open/deferred backend review item.
- Keep all displayed data bounded and derived from the selected platform task.

**Non-Goals:**

- No new backend persistence fields or API contract.
- No legal rectification generation.
- No deep PDF page/OCR location preview.
- No direct MaxKB/OCR provider calls from the browser.

## Decisions

- Derive evidence summaries in `productWorkspacePages.tsx` from `selectedAgentTask.evidence` and `activeReviewItem.evidenceIds` so the UI follows the same task-owned facts used by reporting.
- Reuse `activeReviewQueueItem` for ledger status. Closed decisions are already recoverable through `latestReviewByTargetId`, so no extra backend call is needed.
- Add small scoped CSS classes under `opening-agent-*` and reuse existing tokens for border, surface, and status styling.

## Risks / Trade-offs

- Evidence records may still point to manifest-only or old fallback objects -> show a bounded evidence summary without promising previewability.
- Historical tasks may lack reviewer or decided time -> display a clear "not recorded" fallback rather than fabricating metadata.
