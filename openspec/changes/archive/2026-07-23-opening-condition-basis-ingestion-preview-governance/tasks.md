## 1. Backend Basis Preview Model

- [x] 1.1 Extend basis record normalization with safe `ingestionPreview` facts, missing fields, confidence, status, and next action.
- [x] 1.2 Add deterministic trial preview derivation from source object metadata for bootstrap/intake use.
- [x] 1.3 Add backend decision flow to confirm or reject basis preview without exposing unsafe fields.
- [x] 1.4 Block basis publication when preview confirmation is still required.

## 2. API And Frontend Contract

- [x] 2.1 Expose basis preview fields through existing workspace basis HTTP APIs.
- [x] 2.2 Add frontend TypeScript fields for basis ingestion preview.
- [x] 2.3 Surface preview summary, missing fields, status, and next action on basis/master-data governance.
- [x] 2.4 Surface current-run basis preview status on material-intake preview gate.

## 3. Trial Flow And Smoke

- [x] 3.1 Update trial bootstrap so uploaded basis starts as preview-confirmed/published only when explicitly confirmed by the trial path.
- [x] 3.2 Add retained smoke coverage for provisional preview -> confirm -> publish -> matching readiness.
- [x] 3.3 Ensure unsafe preview inputs are redacted in stored and returned payloads.

## 4. Documentation And Verification

- [x] 4.1 Update runbook/roadmap with basis preview confirmation semantics and next production direction.
- [x] 4.2 Run `npm run smoke:opening-condition`.
- [x] 4.3 Run `npm run smoke:opening-condition:http`.
- [x] 4.4 Run `npm run smoke:opening-condition:ui`.
- [x] 4.5 Run `npm run typecheck`.
- [x] 4.6 Run `openspec validate --changes opening-condition-basis-ingestion-preview-governance`.
