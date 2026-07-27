# Design

## Summary

Introduce an agent-style opening-condition review console as the default workspace page. The console hides internal governance density by default and gives operators one obvious path: choose review scope, upload three material groups, create a review task, then inspect the selected task in a split detail area.

## Interaction Model

### Default State

The workspace overview renders:

- Project context card for the selected construction object.
- Main title: `开工条件核查智能体`.
- Review scope selector:
  - `资料完整性` checked and disabled.
  - `资料合规性` optional, UI-only in this change.
- A chat-like upload entry button: `上传审核资料`.
- A compact history list for current project tasks.

The old high-density task workbench remains available as an advanced section inside the same page or via task routing, but it is no longer the first thing a user sees.

### Upload Modal

The upload modal reuses existing upload and `bootstrapOpeningConditionPilotTrial` behavior.

Rows:

- `合同/资质依据`
- `资料核查表`
- `核查资料包`

`开始解析` is disabled until all three files are selected and the page is allowed to create a new run. The submit message keeps the current backend result semantics.

### Task History and Progress

Task history is derived from existing backend tasks. The title prefers:

1. checklist object file name,
2. task target label,
3. run label.

Progress is derived locally from task state and existing facts:

- no task: 0
- packet uploaded/extracting: early progress
- matching/check items: mid progress
- human review/report ready: late progress
- archived: 100

This is display-only and does not create backend state.

### Task Detail

Task detail uses a split layout:

- Left: uploaded object/file list and a preview placeholder.
- Right: agent progress timeline and report handoff summary.

The left preview is intentionally bounded for MVP. It shows source object metadata and storage identifiers already available to the platform. Real PDF/DOCX rendering is a later enhancement.

### Compliance Logic Boundary

The UI may let operators choose `资料合规性`, but this change does not create deep compliance findings. If selected, the UI communicates that the deep review must be completed by workflow/backend outputs. Existing check items, evidence, human-review items, and report findings remain the only displayed compliance facts.

## Data Sources

- `OpeningConditionPilotTask.packet`
- `OpeningConditionPilotTask.checklistDefinition`
- `OpeningConditionPilotTask.checkItems`
- `OpeningConditionPilotTask.evidence`
- `OpeningConditionPilotTask.humanReviewQueue`
- `OpeningConditionPilotTask.reportAsset`
- Existing `bootstrapOpeningConditionPilotTrial`

## Accessibility and UX

- One primary action per state.
- Disabled upload start has clear explanation.
- Task rows remain buttons with textual progress, not color-only state.
- Progress rings include visible percentage text.
- Advanced diagnostics are progressively disclosed.
