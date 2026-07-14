# LLM draft issue adapter

## Why

The OCR-to-review path now has a persisted review-preparation package. The next useful backend step is to turn that package into structured review issue candidates that the existing workbench can consume.

Today the workbench receives deterministic draft issues from local rules, while the backend LLM integration is still limited to connectivity and review-preparation progress. If we connect a real LLM directly to the UI without a typed adapter, the platform would need to parse free-form text, accept unstable anchors, and mix provider failure with task failure. This change defines the adapter boundary first.

## What Changes

- Add a backend draft issue adapter contract that can generate structured `ReviewIssue` candidates from a review-preparation package and recovered OCR paragraphs.
- Validate LLM output before it reaches the task aggregate.
- Preserve deterministic draft issues as a safe fallback when LLM is unavailable, misconfigured, or returns invalid output.
- Persist accepted candidate issues through the existing review session boundary.

## Non-goals

- No full multi-agent orchestration or long-running worker.
- No vector knowledge-base retrieval.
- No database persistence redesign.
- No UI redesign of the workbench issue panel.
- No report generation change.

## Impact

- `server/llmClient.mjs`
- `server/reviewAgentStream.mjs` or a new backend adapter module
- `server/index.mjs`
- `src/domain/backendConnectivity.ts`
- `src/domain/reviewTypes.ts`
- `src/domain/reviewIssueDrafts.ts`
- `src/domain/reviewSessionService.ts`
- `src/App.tsx`
- `openspec/specs/llm-agent-adapter/spec.md`
- `openspec/specs/review-issue-model/spec.md`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/agent-review-kernel/spec.md`
