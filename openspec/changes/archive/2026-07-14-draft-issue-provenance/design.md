# Design

## Context

Current flow:

```text
review-preparation package
  -> draft issue adapter
  -> generation result
  -> merge issues into task
  -> workbench
```

The generation result currently disappears after merge. The next slice keeps the run metadata:

```text
generation result
  -> DraftIssueGenerationSnapshot
      run id
      source/status/diagnostics
      generated issue ids
      timestamps
  -> task aggregate
  -> workbench provenance indicators
```

## Proposed Domain Shape

Add `ReviewDraftIssueGenerationSnapshot`:

- `runId`
- `source`: `llm | deterministic-fallback`
- `status`: `ready | fallback | failed`
- `startedAt`
- `completedAt`
- `issueIds`
- `candidateCount`
- `diagnostics`: safe status/message
- `preparationPackageId`

Add optional provenance metadata to generated AI issues:

- `generationRunId`
- `generationSource`
- `generatedAt`

Manual issues keep `source: manual` and do not require generation metadata.

## Session Boundary

Extend the merge operation so it accepts:

- generated issues
- generation result diagnostics
- preparation package id

The session service should:

- deduplicate issues as it does today
- attach provenance to newly accepted generated issues
- store or update the latest generation snapshot on the task
- keep issue decision state unchanged

## Workbench Presentation

The workbench should expose provenance as compact trust context:

- LLM generated
- Deterministic fallback
- Manual annotation

This should be visible on issue cards without adding a new workflow step. The card should still prioritize severity, title, anchor, reason, basis, and decision controls.

## Fallback and Recovery

If generation fails or returns zero issues, the task should still store a generation snapshot with:

- `status: failed` or `fallback`
- zero candidate count when appropriate
- safe diagnostics

This prevents repeated silent attempts on reopen and gives later debugging a stable record.

## Task Groups

Task Group A: Contract and domain model

- Add generation snapshot and issue provenance types.
- Update OpenSpec main specs after implementation.

Task Group B: Session persistence

- Extend merge service to store snapshot and tag generated issues.
- Preserve dedupe and existing issue counts.

Task Group C: Workbench visibility

- Show compact provenance labels on issue cards.
- Preserve existing decision controls and layout density.

Task Group D: Verification and archive

- Run `npm run typecheck`.
- Do a fallback-path smoke review by checking a generated snapshot can be stored.
- Archive after completion.

## Risks

- Overloading issue cards with diagnostic details could reduce reviewer focus. Keep the UI compact.
- Diagnostics must remain safe and never contain prompts, keys, raw provider traces, or private object URLs.
- Provenance should be task-level and issue-level enough for recovery, but not a full audit log yet.
