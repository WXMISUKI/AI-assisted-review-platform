## Context

The repository already contains most of the construction-plan report export path:

- completed review tasks persist `resultAsset`
- `supervisor-report` assets have stable fields suitable for handoff
- a backend HTML-to-DOCX adapter already exists for the platform
- the result preview page already has export-oriented UI hooks

What is missing is not a brand-new architecture, but a disciplined closure pass:

- formal spec artifacts
- deterministic smoke coverage for the report builder and export API boundaries
- synchronized documentation so this slice can be treated as an intentional delivery milestone

## Goals / Non-Goals

**Goals:**

- Export only `supervisor-report` assets in this slice.
- Keep all external conversion calls backend-owned.
- Return safe failure states when export cannot run.
- Preserve a user-visible HTML fallback from the result preview page.
- Add repeatable smoke coverage without depending on a real external `http_tools` deployment.

**Non-Goals:**

- Do not export `revised-plan-snapshot` yet.
- Do not redesign the result preview page.
- Do not add asynchronous export queueing in this slice.
- Do not change opening-condition export behavior.

## Decisions

1. Keep `supervisor-report` as the only exportable report type for now.
   - Rationale: it is the clearest high-value handoff asset and already has a stable structure.

2. Validate export failure boundaries without requiring a real HTTP tools service.
   - Rationale: the repo needs deterministic smoke. We can force the `not_configured` branch and still validate the API contract, status mapping, and safe diagnostics.

3. Keep HTML fallback on the frontend rather than blocking the result page on DOCX export availability.
   - Rationale: MVP handoff should degrade safely instead of disappearing when adapter configuration is absent.

## Risks / Trade-offs

- [Risk] Frontend HTML fallback can drift from backend export HTML over time.
  - Mitigation: document the risk now and keep this slice focused; a later refinement can extract a shared bounded builder contract.
- [Risk] Export success still depends on environment-specific HTTP tools configuration.
  - Mitigation: expose safe diagnostics and keep HTML fallback available for MVP delivery.
- [Risk] Result export remains limited to one asset type.
  - Mitigation: treat `revised-plan-snapshot` export as a later independent slice.
