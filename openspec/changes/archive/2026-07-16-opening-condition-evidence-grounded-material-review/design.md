## Context

The opening-condition pilot already has workspace-scoped tasks, published basis versions, published master data, checklist matching, human review, and report gating. The remaining gap is not a larger tenant platform; it is a more trustworthy material-review model for a real single-project pilot.

The confirmed business rule is: subcontract contracts establish participating organization and work-scope boundaries, while personnel and equipment are validated through published or human-approved project master data under that boundary. This keeps the pilot realistic because construction contracts often do not enumerate every worker, special-operation certificate, rental crane, pump truck, or instrument.

## Goals / Non-Goals

**Goals:**

- Model material review as layered evidence rather than a single pass/fail flag.
- Require personnel and equipment checklist items to resolve against published or human-approved master data.
- Preserve contract and supplemental basis records as the authority for organization and scope boundaries.
- Treat signature, stamp, checkbox, handwritten date, and unclear visual evidence as reviewable assertions with confidence and safe locator summaries.
- Keep implementation in the current Node BFF and React/Vite demo surfaces without introducing a workflow engine or database migration.

**Non-Goals:**

- Build a complete multi-tenant authorization platform.
- Prove legal authenticity of physical stamps or signatures.
- Replace reviewer judgment for low-confidence visual fields.
- Recreate the old Dify workflow as the source of truth.
- Audit on-site inspection items that have no submitted material evidence in the current scope.

## Decisions

1. **Use layered checklist outcomes.**

   Each check item can carry `scopeStatus`, `documentPresence`, `relevanceStatus`, `contentCompliance`, `visualAssertions`, and `finalDisposition` in addition to the existing verdict. This keeps backward compatibility while making the pilot outcome auditable.

   Alternative considered: replace verdict with a new state machine. Rejected because the UI and report summary already depend on the current verdict shape.

2. **Bind personnel and equipment to master data, not only uploaded files.**

   A personnel or equipment item only passes automatically when every required `masterDataId` resolves to a published or human-approved record in the task's required master data. Matching a file name or summary is evidence, not authorization.

   Alternative considered: require all personnel and equipment to appear in the contract text. Rejected because real contracts often define scope and responsible entity rather than complete operational rosters.

3. **Keep visual evidence as assertions.**

   Visual signals such as stamps, signatures, checkboxes, and unclear dates are represented as `visualAssertions` with type, status, confidence, locator, and reviewer-required flag. They can trigger human review and report wording, but they do not prove legal authenticity.

   Alternative considered: treat stamp/signature detection as automatic compliance. Rejected because OCR and visual models cannot reliably prove authenticity or authorization.

4. **Platform-owned workflow remains primary.**

   The platform owns tasks, evidence, decisions, and report gates. Dify or other external orchestration can be an adapter later, but imported results must normalize into platform records before display or reporting.

## Risks / Trade-offs

- [Risk] More states can make the UI feel complex. -> Mitigation: expose concise labels and keep legacy verdict summaries for dashboards.
- [Risk] Demo matching is still based on object summaries rather than full OCR coordinates. -> Mitigation: store the new layered fields now and limit locators to safe summaries until page-image evidence is available.
- [Risk] Master-data IDs are user or workflow supplied in the current pilot. -> Mitigation: never auto-pass personnel/equipment when required master data is missing, and make the missing authorization explicit in human review.
- [Risk] Reviewers may expect stamp authenticity. -> Mitigation: report wording must distinguish "detected/confirmed presence" from "legally authentic".

## Migration Plan

- Extend existing TypeScript interfaces and backend normalization with optional layered outcome fields.
- Update deterministic matching to populate the fields and create targeted human-review reasons.
- Update docs and demo data to explain the contract boundary and master-data authorization model.
- Keep existing API routes and persisted JSON shape compatible by adding optional fields only.
