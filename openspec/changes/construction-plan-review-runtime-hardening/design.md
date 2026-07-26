## Context

The repo state already contains today's runtime-stability fixes for:

- opening-condition report delivery TDZ crash removal
- lightweight placeholder review tasks during upload/parsing
- localStorage quota fallback compaction

However, the user-reported DOCX parsing error references an older `node-fetch` import path that no longer exists in current source. That strongly suggests a stale local backend process or a local runtime mismatch. We still want the current codebase to make this diagnosable immediately from `/api/health`, and we want the DOCX object-review path to fail with a precise runtime message if `globalThis.fetch` is unavailable.

## Goals / Non-Goals

**Goals:**

- Make the active backend runtime self-describing for local debugging.
- Ensure the DOCX object-review code path resolves fetch in one place and reports a safe actionable failure.
- Add a regression smoke that proves current source no longer depends on `node-fetch`.
- Keep verification light and aligned with existing local-development expectations.

**Non-Goals:**

- Do not add `node-fetch` back as a dependency.
- Do not redesign construction-plan DOCX parsing, section recovery, or preview rendering in this slice.
- Do not change opening-condition workflow logic.
- Do not introduce build-time bundling or production deployment changes.

## Decisions

1. Expose runtime diagnostics from `/api/health`.
   - Rationale: the fastest way to separate "old running process" from "current source" is to let the backend report its active runtime capabilities.
   - Alternative considered: only improve thrown errors in the DOCX route. Rejected because health inspection is easier before re-running uploads.

2. Resolve DOCX download fetch through a dedicated helper.
   - Rationale: one fetch-resolution function avoids route-level drift and keeps the runtime contract explicit.
   - Alternative considered: inline `globalThis.fetch` checks in every route. Rejected as duplicated and easier to regress.

3. Keep the runtime contract on Node-native fetch.
   - Rationale: current repo assumptions and Node 24 local development already support `globalThis.fetch`; reintroducing `node-fetch` would add unnecessary dependency surface.
   - Alternative considered: add `node-fetch` as compatibility fallback. Rejected because current source no longer requires it and the reported error points to stale runtime state, not a needed package.

## Risks / Trade-offs

- [Risk] Some developers may interpret the new health diagnostics as a production contract.
  - Mitigation: keep the diagnostics small, safe, and clearly runtime-focused.
- [Risk] A stricter runtime error could expose local upgrade friction on unsupported Node versions.
  - Mitigation: make the message actionable and safe, with restart/Node-version guidance.
