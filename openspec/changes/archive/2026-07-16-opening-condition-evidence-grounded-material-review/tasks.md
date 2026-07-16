## 1. Project Positioning And Domain Decisions

- [x] 1.1 Add opening-condition material-review terms to the project domain glossary.
- [x] 1.2 Record the platform-owned workflow and contract-scoped master-data decision in docs.
- [x] 1.3 Update product and pilot workflow docs to remove Dify-as-primary wording and clarify external workflow adapter boundaries.

## 2. Layered Review Data Model

- [x] 2.1 Extend opening-condition pilot frontend types with layered material-review outcome fields.
- [x] 2.2 Extend backend normalization for layered outcomes and visual assertions while preserving existing verdict compatibility.

## 3. Matching And Human Review Rules

- [x] 3.1 Update deterministic checklist matching so personnel/equipment items require published or human-approved master-data authorization.
- [x] 3.2 Detect out-of-scope and visual-assertion checklist hints and route them to not-applicable or human-review outcomes.
- [x] 3.3 Update human-review reasons and evidence summaries to distinguish missing material, authorization gap, ambiguity, and visual uncertainty.

## 4. Demo Surface And Verification

- [x] 4.1 Refresh opening-condition demo packet data to show contract boundary, personnel/equipment master data, visual assertion, and final disposition states.
- [x] 4.2 Add or update focused backend tests for master-data authorization, visual assertion review, and out-of-scope material handling.
- [x] 4.3 Run targeted validation: backend node test, `node --check` for changed `.mjs`, and `npm run typecheck`.
