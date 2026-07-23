## 1. Backend Extraction Core

- [x] 1.1 Add deterministic basis preview extraction helpers that derive safe facts from source object metadata and optional bounded text.
- [x] 1.2 Extend basis record normalization to retain extraction provenance, fact summary, missing fields, confidence, and next action.
- [x] 1.3 Add a basis preview extraction mutation that refreshes a basis record into `needs_confirmation`.
- [x] 1.4 Keep publication blocked until preview is confirmed.

## 2. HTTP And Domain Wiring

- [x] 2.1 Expose a basis extraction API route for workspace basis records.
- [x] 2.2 Add domain/client helpers for preview extraction and basis preview refresh.
- [x] 2.3 Ensure trial bootstrap and intake preview reuse the same extraction model.

## 3. Frontend Governance Surfaces

- [x] 3.1 Show extracted basis preview facts, provenance, missing fields, and next action in the basis governance view.
- [x] 3.2 Show basis preview refresh status on the intake preview gate.
- [x] 3.3 Keep report and history views unchanged except for updated basis provenance text where relevant.

## 4. Smoke, Docs, and Verification

- [x] 4.1 Add smoke coverage for extraction -> confirm -> publish -> formal matching readiness.
- [x] 4.2 Update the runbook and roadmap with extraction semantics and next-step direction.
- [x] 4.3 Run `npm run smoke:opening-condition`.
- [x] 4.4 Run `npm run smoke:opening-condition:http`.
- [x] 4.5 Run `npm run smoke:opening-condition:ui`.
- [x] 4.6 Run `npm run typecheck`.
- [x] 4.7 Run `openspec validate --changes opening-condition-basis-preview-structured-extraction`.
