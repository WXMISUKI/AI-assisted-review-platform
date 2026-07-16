## 0. Security And Scope Guardrails

- [x] 0.1 Confirm the imported Dify workflow is not used by the pilot path; any old workflow credentials are excluded from real external calls.
- [x] 0.2 Add a short documentation note that workflow credentials must live in managed secrets or server-side environment variables, never repository files or frontend-visible payloads.
- [x] 0.3 Define safe diagnostic redaction rules for opening-condition task events, imported workflow output, and report summaries.

## 1. Domain Contracts And Persistence Adapter

- [x] 1.1 Add opening-condition pilot domain types for workspace context, basis version reference, master-data reference, packet, task, state, checklist item, evidence, human-review item, task event, and report asset.
- [x] 1.2 Implement a backend persistence adapter interface shaped for relational storage while allowing a local development adapter for the pilot.
- [x] 1.3 Add validation helpers for required workspace, tenant, project, contract package, organization, basis version, packet, and object-reference fields.
- [x] 1.4 Add unit-level verification for state transitions, required field validation, and safe summary redaction.

## 2. Basis And Master-Data Gates

- [x] 2.1 Add backend contracts or endpoints to read, create, confirm, and publish pilot basis-set versions in the selected workspace.
- [x] 2.2 Add backend contracts or endpoints to read, confirm, reject, and publish pilot master-data records.
- [x] 2.3 Enforce formal task creation gates: no published basis blocks the task, and missing required master data blocks or sends affected items to human review.
- [x] 2.4 Update the opening-condition basis and master-data pages to consume backend-owned records with mock fallback only for local demo mode.

## 3. Packet Intake And Controlled Workflow

- [x] 3.1 Add pilot task creation API that binds workspace context, published basis version, and submitted checklist/package object references.
- [x] 3.2 Add task state machine transitions for draft, blocked prerequisites, ready, packet uploaded, extracting, matching, awaiting human review, report ready, archived, failed, and canceled.
- [x] 3.3 Implement controlled packet intake that inventories submitted package files and records bounded file/object summaries.
- [x] 3.4 Add replayable task events for packet upload, extraction start/end, matching start/end, human-review wait, report generation, failure, cancellation, and archive.

## 4. Checklist Matching And Semantic Assistance

- [x] 4.1 Parse the submitted opening-condition checklist into normalized required items with stable ids, names, categories, and expected evidence hints.
- [x] 4.2 Match checklist items against package inventory, published master data, and basis references using deterministic rules first.
- [x] 4.3 Store evidence references for matched files, locators, extracted values, confidence labels, and referenced master-data ids.
- [x] 4.4 Add a bounded semantic-assistance adapter for ambiguous item labels or document relevance, storing semantic notes separately from deterministic verdicts.
- [x] 4.5 Mark low-confidence, conflicting, missing, or ambiguous outcomes for human review instead of passing them silently.

## 5. Human Review Queue

- [x] 5.1 Add backend contracts or endpoints for listing human-review items by task and workspace.
- [x] 5.2 Add actions to confirm, correct, reject, or defer human-review items with reviewer placeholder, timestamp, safe note, and resulting target status.
- [x] 5.3 Update the opening-condition human-review page to operate on backend-owned queue items and decisions.
- [x] 5.4 Gate report readiness on completion of blocking human-review items.

## 6. Auxiliary Report And Archive

- [x] 6.1 Generate an internal auxiliary report summary from platform-owned task records, check item outcomes, evidence, human decisions, basis version, and workspace context.
- [x] 6.2 Store report assets and report-ready task events without secrets, private object URLs, raw provider traces, or unbounded source text.
- [x] 6.3 Update the opening-condition reports page to display report summaries, counts, basis version, auxiliary-opinion disclaimer, and evidence-linked issue summaries.
- [x] 6.4 Add archive transition that preserves the task, report asset, evidence summary, and event trail.

## 7. Optional Adapter Boundary

- [x] 7.1 Refactor the current Dify bridge naming or comments so it is clearly an optional adapter/reference workflow, not the required pilot execution path.
- [x] 7.2 Add normalization tests or fixtures showing that imported workflow output becomes platform-owned records before display.
- [x] 7.3 Ensure adapter payloads use bounded object references and safe summaries instead of credentials, private URLs, raw provider traces, or unbounded document text.

## 8. Verification And Handoff

- [x] 8.1 Run targeted TypeScript verification for changed frontend/domain files.
- [x] 8.2 Run `node --check` or equivalent syntax checks for changed backend `.mjs` files.
- [x] 8.3 Validate OpenSpec with `openspec validate --all --strict`.
- [x] 8.4 Update relevant docs if implementation changes API contracts, state names, persistence boundaries, or security guidance.
- [x] 8.5 Archive the OpenSpec change only after implementation and verification are complete.
