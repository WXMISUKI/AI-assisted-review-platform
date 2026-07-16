# opening-condition-pilot-workflow Specification

## Purpose
TBD - created by archiving change opening-condition-pilot-controlled-workflow. Update Purpose after archive.
## Requirements
### Requirement: Pilot workspace execution boundary
The system SHALL support a single-project opening-condition pilot workflow scoped to one selected workspace, project or contract package, and participating organization while preserving tenant and organization identifiers for future expansion.

#### Scenario: Pilot workspace is selected
- **WHEN** a user starts the opening-condition pilot workflow
- **THEN** the system records the selected workspace id, tenant id, project id, contract package id, and participating organization id in the task context

#### Scenario: Workspace context is missing
- **WHEN** a user attempts to create a formal pilot task without selected workspace context
- **THEN** the system rejects the task creation with a safe validation message

### Requirement: Platform-owned pilot persistence
The system SHALL persist opening-condition pilot facts as platform-owned records for tasks, packets, checklist items, evidence, human decisions, task events, and report assets.

#### Scenario: Packet is accepted for processing
- **WHEN** a user submits a checklist and material package for a pilot task
- **THEN** the system creates platform records for the packet, task, source object references, and initial task event

#### Scenario: External workflow output is imported
- **WHEN** any external workflow or model output contributes extraction or matching results
- **THEN** the system normalizes the output into platform-owned task, item, evidence, or report records before display

### Requirement: Pilot task state machine
The system SHALL expose a bounded opening-condition pilot task state machine covering prerequisites, packet intake, extraction, matching, human review, report generation, terminal failure, cancellation, archive, and replayable progress events.

#### Scenario: Published basis is missing
- **WHEN** a user attempts to start a formal pilot task without a published basis version
- **THEN** the task is blocked or rejected as `blocked_missing_basis`

#### Scenario: Published master data is missing
- **WHEN** required master data is not published for formal checking
- **THEN** affected task items are blocked or marked for human review instead of being passed automatically

#### Scenario: Workflow progresses
- **WHEN** the task moves through packet upload, extraction, matching, human review, report generation, or archive
- **THEN** the system records a safe task event with timestamp, stage, status, progress summary, and bounded diagnostic data

#### Scenario: Workflow fails
- **WHEN** extraction, matching, semantic assistance, or report generation fails
- **THEN** the system marks the task failed with a safe diagnostic summary and preserves previously confirmed basis and master-data records

### Requirement: Checklist and package completeness matching
The system SHALL compare required opening-condition checklist items against the submitted material package, published basis version, and published master data before producing auxiliary conclusions.

#### Scenario: Required item has matching material
- **WHEN** a checklist item maps to an uploaded file and matching evidence
- **THEN** the system records the matched file reference, locator summary, extracted values, and deterministic verdict

#### Scenario: Required item is missing
- **WHEN** a checklist item has no matching uploaded material or published master-data support
- **THEN** the system records a failed or warning verdict with the missing evidence reason

#### Scenario: Match is ambiguous
- **WHEN** file names, extracted text, or master-data references are ambiguous
- **THEN** the system records the item as requiring human review with bounded evidence summaries

### Requirement: Controlled semantic assistance
The system SHALL use OCR or LLM assistance only as bounded semantic support for extraction summaries, document relevance, and ambiguous checklist matching, without replacing deterministic verdict fields.

#### Scenario: Semantic note is generated
- **WHEN** semantic assistance evaluates an ambiguous item
- **THEN** the system stores a semantic note separately from rule verdict, evidence references, and human decision fields

#### Scenario: Semantic and rule results conflict
- **WHEN** semantic assistance disagrees with deterministic matching
- **THEN** the system marks the item for human review and preserves both outputs

### Requirement: Human review queue and decisions
The system SHALL create human-review queue items and persist reviewer decisions for basis entries, master-data records, checklist items, and report readiness gates.

#### Scenario: Human review is required
- **WHEN** confidence is low, evidence conflicts, stamp or signature recognition is uncertain, or a prerequisite is incomplete
- **THEN** the system creates a human-review item with target type, target id, reason, evidence summary, and status

#### Scenario: Human decision is completed
- **WHEN** a reviewer confirms, corrects, rejects, or defers a human-review item
- **THEN** the system records the decision, reviewer identity placeholder, timestamp, safe note, and resulting target status

### Requirement: Auxiliary report archive
The system SHALL generate and archive an internal auxiliary report summary only after task records, evidence, and required human decisions have been reconciled.

#### Scenario: Report becomes ready
- **WHEN** all required checklist outcomes are recorded and blocking human-review items are completed
- **THEN** the system creates a report asset linked to the workspace, basis version, packet, check items, evidence, and task event trail

#### Scenario: Report is displayed
- **WHEN** a user opens the pilot report
- **THEN** the system displays auxiliary-opinion wording, pass/fail/warning/human-review counts, basis version, workspace context, and evidence-linked issue summaries

### Requirement: Workflow credential hygiene
The system SHALL keep external workflow, OCR, LLM, and storage credentials out of repository files, frontend responses, logs, persisted task summaries, report assets, and callback payload summaries.

#### Scenario: Existing exposed credentials are discovered
- **WHEN** a workflow file or configuration contains plaintext external service credentials
- **THEN** the credentials are treated as compromised and must be rotated before real external execution

#### Scenario: Unsafe workflow field is received
- **WHEN** a workflow callback, import, or diagnostic payload includes secrets, private URLs, provider traces, or unbounded document text
- **THEN** the system redacts or omits those fields before persistence or display

