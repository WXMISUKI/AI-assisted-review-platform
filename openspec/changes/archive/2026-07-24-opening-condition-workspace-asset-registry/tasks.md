## 1. Registry Derivation

- [x] 1.1 Add workspace asset registry summary types and derivation helpers in `src/domain/openingConditionReview.ts`.
- [x] 1.2 Derive per-workspace counts for basis ownership, master-data readiness, knowledge-base readiness, and historical run presence using existing packet/workspace facts.

## 2. Overview Rendering

- [x] 2.1 Render a selected-workspace asset registry card on the opening-condition overview.
- [x] 2.2 Render asset-aware summaries on selectable workspace records so neighboring contexts can be compared before switching.
- [x] 2.3 Add minimal shared styles for the asset registry cards and badges in `src/styles/opening-condition.css`.

## 3. Verification And Docs

- [x] 3.1 Add or update lightweight UI smoke to assert the overview renders asset registry language.
- [x] 3.2 Update `docs/opening-condition-next-stage-plan.md` with the project/workspace asset-isolation priority.
- [x] 3.3 Run `npm run smoke:opening-condition:ui`.
- [x] 3.4 Run `openspec validate --changes opening-condition-workspace-asset-registry`.

## 4. Archive

- [x] 4.1 Sync delta specs into the main specs.
- [x] 4.2 Archive the completed OpenSpec change.
