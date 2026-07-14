# Review generation activity trail

## Why

The platform now stores the latest review generation run snapshot and supports safe retry after failed generation. That gives the UI a stable current state, but it still loses the sequence of what happened across starts, retries, degraded recovery, and completion.

The product positioning emphasizes auditable and traceable human-AI review. Before introducing a database-backed worker or full audit-log service, the MVP should define a lightweight, safe activity trail on the review task aggregate. This trail should explain the review-generation lifecycle without exposing provider prompts, credentials, raw traces, private object URLs, or raw document text.

## What Changes

- Add a review generation activity trail contract to the review task aggregate.
- Record safe lifecycle events for generation start, stage update, preparation package persistence, draft issue generation, degraded completion, failure, retry, and ready completion.
- Expose the activity trail through the review session snapshot.
- Surface a compact recent activity summary in loading/detail or document task surfaces without replacing the full future audit-log design.
- Keep the current `reviewGenerationRun`, `preparationPackage`, and `draftIssueGenerationSnapshot` contracts intact.

## Non-goals

- No database audit-log table.
- No full user operation log.
- No provider raw trace or prompt storage.
- No report generation changes.
- No large workbench redesign.

## Impact

- `src/domain/reviewTypes.ts`
- `src/domain/reviewSessionService.ts`
- `src/domain/reviewTaskOrchestration.ts`
- `src/appShellPages.tsx`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/review-agent-orchestration/spec.md`
- `openspec/specs/review-workbench/spec.md`
