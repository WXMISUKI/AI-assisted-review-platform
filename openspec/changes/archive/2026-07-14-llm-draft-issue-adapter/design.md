# Design

## Current Flow

```text
OCR result
  -> recovered structure
  -> review-preparation package
  -> deterministic draft issues
  -> review session / workbench
```

This change adds an adapter between the preparation package and the session issue list:

```text
review-preparation package + recovered paragraphs
  -> draft issue adapter
      -> LLM structured output when configured and valid
      -> deterministic fallback when not
  -> normalized ReviewIssue candidates
  -> task aggregate
  -> workbench
```

## Proposed Backend Contract

Add a backend draft issue endpoint:

```text
POST /api/review-agent/draft-issues
```

Request shape:

- `taskId`
- `preparationPackage`
- `paragraphs`: limited recovered paragraphs or paragraph excerpts
- `mode`: `review | revise`
- optional `maxIssues`

Response shape:

- `ok`
- `source`: `llm | deterministic-fallback`
- `status`: `ready | fallback | failed`
- `issues`: normalized review issue candidates
- `diagnostics`: safe non-secret summary

The endpoint should never return raw provider errors with secrets, prompts containing private keys, or unbounded raw OCR content.

## LLM Output Rules

The adapter should ask the model for strict JSON matching a narrow issue candidate schema:

- stable id or candidate id
- severity
- paragraph id
- anchor text
- finding title, reason, basis, suggestion
- kernel metadata when available

The backend must validate and normalize output:

- Ensure every issue has a paragraph id that exists in the submitted paragraph set.
- Resolve anchor offsets from anchor text where possible.
- Drop or mark invalid candidates rather than passing malformed issues to the frontend.
- Deduplicate against deterministic draft issues by title, paragraph id, and anchor text.

## Fallback Strategy

Fallback is not an error state for the review task.

Use deterministic draft rules when:

- LLM provider is not configured.
- LLM call fails.
- LLM returns invalid JSON.
- No valid candidate anchors can be resolved.

The response should indicate fallback source and include diagnostics that can be shown safely in developer panels or logs.

## Frontend Session Flow

When review preparation completes and a package is stored:

1. If recovered paragraphs exist, request draft issue candidates.
2. Normalize the response into existing `ReviewIssue` objects.
3. Merge candidates into the task issue list through the session service.
4. Keep the workbench entry unchanged.

If the backend endpoint is unavailable, the frontend keeps using the existing deterministic issues from `reviewIssueDrafts`.

## Task Groups

Task Group A: Contract and schema

- Define backend request/response types.
- Define issue candidate validation expectations.
- Update OpenSpec contracts.

Task Group B: Backend adapter

- Add a draft issue adapter module.
- Add safe LLM JSON invocation or deterministic fallback.
- Add endpoint wiring.

Task Group C: Frontend/session integration

- Add client API for draft issue generation.
- Add session service merge operation.
- Trigger candidate generation after preparation package completion.

Task Group D: Verification and archive

- `npm run typecheck`.
- `node --check` for changed backend files.
- Smoke test fallback behavior without requiring real LLM credentials.
- Archive after tasks complete.

## Risks

- LLM output may hallucinate anchors. Validation must prefer dropping invalid candidates over forcing them into the UI.
- Sending too much OCR text to the backend can increase latency and data exposure. Limit paragraphs or excerpts in the first slice.
- Duplicate rule and LLM findings can confuse reviewers. Merge and dedupe before persisting.
