## Context

The platform already supports basis preview governance: a basis record can store `ingestionPreview`, be confirmed, and then be published. The missing production step is a repeatable extraction path that turns an uploaded basis object and safe bounded text into candidate facts. This change keeps extraction deterministic and local so it can be tested now, while leaving OCR/MaxKB/LLM enrichment as later providers that can feed the same preview contract.

## Goals / Non-Goals

**Goals:**

- Add a backend extraction function that derives safe preview facts from source object metadata plus optional bounded text.
- Expose extraction through an HTTP route on an existing basis record.
- Store extraction provenance, missing fields, confidence, and next action in `ingestionPreview`.
- Keep extracted facts provisional until human confirmation and publication.
- Add smoke coverage across domain and HTTP layers.

**Non-Goals:**

- Do not integrate a real OCR worker result parser in this slice.
- Do not call MaxKB, Dify, OpenAI, or other providers.
- Do not redesign the whole governance page.
- Do not create a new database schema or migration.

## Decisions

1. **Use a deterministic local extractor first.**
   - Rationale: it makes the preview lifecycle testable immediately and avoids provider instability during pilot hardening.
   - Alternative rejected: direct LLM extraction. It would add accuracy and security concerns before the governance loop is proven.

2. **Extract into the existing `ingestionPreview` contract.**
   - Rationale: confirmation, publication, UI display, and smoke tests already know this shape.
   - Alternative rejected: add a new extraction job aggregate now. That is useful later for async OCR but too broad for this slice.

3. **Keep source text bounded and sanitized.**
   - Rationale: basis files can contain sensitive data; the preview must not store raw OCR text, private URLs, prompts, tokens, or provider traces.

4. **Expose extraction as a basis-record action.**
   - Rationale: operators think in terms of the basis record they are reviewing, not a separate generic extraction pipeline.

## Risks / Trade-offs

- Deterministic extraction is shallow -> mark facts as candidate preview and require human confirmation.
- Optional text can still be user-provided rather than OCR-derived -> record extraction source and confidence clearly.
- UI remains dense -> show extraction summary locally and postpone larger visual refactor.
