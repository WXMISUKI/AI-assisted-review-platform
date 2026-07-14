# Draft issue provenance

## Why

The platform can now generate structured draft issues from a review-preparation package through an LLM adapter, with deterministic fallback when the model is unavailable or invalid. However, the task aggregate only stores the merged issues. It does not retain the generation run that produced them, the source used (`llm` or `deterministic-fallback`), or safe diagnostics from the adapter.

Reviewers and later audit/report flows need to understand whether an issue came from deterministic rules, LLM semantic generation, manual annotation, or fallback recovery. Without provenance, generated issues become harder to trust, debug, and explain.

## What Changes

- Add a draft issue generation snapshot to the review task aggregate.
- Link generated AI issues to the generation run that produced them.
- Preserve safe diagnostics such as generation source, status, candidate count, and non-secret message.
- Surface generation provenance in the workbench without changing issue decision behavior.

## Non-goals

- No new LLM generation behavior.
- No report generation changes.
- No backend database or audit-log service.
- No redesign of the issue card layout.
- No manual issue workflow changes beyond keeping manual issues distinguishable.

## Impact

- `src/domain/reviewTypes.ts`
- `src/domain/reviewSessionService.ts`
- `src/domain/backendConnectivity.ts`
- `src/ReviewWorkbenchPage.tsx`
- `src/App.tsx`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/review-issue-model/spec.md`
- `openspec/specs/review-workbench/spec.md`
- `openspec/specs/llm-agent-adapter/spec.md`
