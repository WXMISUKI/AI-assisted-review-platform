## Context

The opening-condition MVP has reached a repeatable pilot loop: intake, formal matching, human review, report, DOCX export, archive, and rectification rerun. Basis governance has also moved toward a clear preview lifecycle, where uploaded basis material can expose structured facts before confirmation and publication.

Master data is weaker. Records exist, can be approved/rejected, and can be used by preflight readiness, but the operator experience still exposes trial-era concepts such as `human_approved` without explaining whether the record is a candidate, current-run override, reusable published fact, or rejected exception. This is the main trust gap before the pilot can be presented as a minimum usable delivery package.

## Goals / Non-Goals

**Goals:**

- Make master-data candidates explain what the platform thinks it extracted and why it is usable or not.
- Align master-data governance with the existing basis preview pattern without breaking the current single-project pilot.
- Preserve a distinction between current-run confirmed facts and reusable workspace published catalog records.
- Improve preflight and frontend wording so operators understand which facts are pending confirmation, ready to publish, published, or rejected.
- Add focused regression coverage for the lifecycle states that affect formal matching readiness.

**Non-Goals:**

- No full database migration or durable multi-user approval workflow.
- No broad visual redesign of the whole workspace.
- No new OCR, MaxKB, Dify, or LLM provider integration in this change.
- No attempt to solve every extraction-accuracy issue; this change governs candidate facts after they exist.

## Decisions

1. **Extend the existing master-data record shape instead of adding a separate table.**

   Rationale: the local pilot store already owns master-data records and the frontend already reads this collection. Adding preview fields to the normalized record keeps this MVP change small and avoids premature schema migration.

   Alternative considered: create a separate `masterDataPreviews` collection. That is cleaner long term, but it adds synchronization complexity before persistence architecture is settled.

2. **Treat `human_approved` as a backwards-compatible current-run confirmation, not a reusable catalog publication.**

   Rationale: existing smoke tests and trial bootstrap rely on `human_approved` records to unlock a run. Removing that immediately would slow the MVP. The UI and API should instead label it as "confirmed for current run" and reserve `published` for reusable workspace catalog records.

   Alternative considered: require `published` only before formal matching. That is the stricter future target, but it would force a larger migration of trial bootstrap and current tests.

3. **Use safe preview metadata only.**

   Rationale: candidate previews must not leak raw OCR text, prompts, provider traces, private object URLs, or credentials. Store bounded source file labels, evidence notes, extracted facts, missing fields, confidence, and next actions.

4. **Make readiness diagnostics explain publication gaps.**

   Rationale: operators need to know whether formal matching is blocked by missing master data, unconfirmed candidates, or reusable publication debt. The preflight output should remain compact but more specific.

## Risks / Trade-offs

- Trial bootstrap may still generate placeholder-like master data -> mitigate by labeling source and next action clearly, and by keeping this change focused on governance semantics.
- More metadata can make the page denser -> mitigate by grouping current-run candidates, reusable catalog, and exceptions instead of adding another global panel.
- `human_approved` compatibility can confuse future production rules -> mitigate by documenting it as a current-run override and adding specs that keep `published` distinct.
