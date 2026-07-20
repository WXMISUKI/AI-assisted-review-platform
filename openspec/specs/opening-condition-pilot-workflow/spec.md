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

### Requirement: Contract-scoped master-data matching
The system SHALL enforce contract-scoped master-data matching for personnel and equipment checklist items in the opening-condition pilot workflow.

#### Scenario: Personnel or equipment item has only uploaded material
- **WHEN** a personnel or equipment checklist item matches an uploaded file but has no published or human-approved project master-data support
- **THEN** the system does not automatically pass the item and creates a human-review reason for missing master-data authorization

#### Scenario: Personnel or equipment item has authorized master data
- **WHEN** a personnel or equipment checklist item matches uploaded evidence and all required master-data references are published or human-approved within the selected workspace
- **THEN** the system records the item as authorized by project master data under the published basis boundary

### Requirement: Material-only pilot scope
The system SHALL distinguish material-review checklist items from unsupported on-site, emergency-response, or field-observation checklist items during the pilot.

#### Scenario: Unsupported field item appears in checklist input
- **WHEN** a checklist item is identified as outside the current material-review scope
- **THEN** the system marks the item as not applicable or out of scope and excludes it from missing-material failure counts

### Requirement: Visual assertion review gate
The system SHALL create human-review gates for required low-confidence visual assertions during opening-condition pilot matching.

#### Scenario: Signature or stamp is required and uncertain
- **WHEN** an item hint or extracted summary indicates that signature, stamp, checkbox, seal, or handwritten date evidence is required and the submitted packet lacks stable evidence for it
- **THEN** the system records a visual assertion gap and opens a human-review item before report generation

### Requirement: Preflight-gated formal review
The system SHALL gate formal opening-condition pilot matching behind published basis, required master data, and workspace-bound subcontract-team knowledge-base readiness.

#### Scenario: Formal review is requested before preflight completion
- **WHEN** a user requests formal checklist matching before the workspace has completed required preflight gates
- **THEN** the system rejects or blocks the formal review with a safe readiness summary instead of running a best-effort match

#### Scenario: Draft setup remains allowed
- **WHEN** preflight is incomplete
- **THEN** the system still allows draft basis, draft master data, knowledge-base setup, and packet intake actions that do not produce formal auxiliary conclusions

### Requirement: Platform-first workflow path
The system SHALL treat Dify workflow behavior as reference or optional adapter behavior, not as the main opening-condition pilot workflow path.

#### Scenario: Dify is not configured
- **WHEN** Dify is unavailable, disabled, or not selected
- **THEN** the opening-condition pilot workflow still supports platform-owned preflight readiness, material matching, human-review queue, and auxiliary report archive

#### Scenario: External output is imported
- **WHEN** OCR, LLM, Dify, or another adapter contributes extraction or matching output
- **THEN** the output must normalize into platform-owned records before it affects readiness, review results, or reporting

### Requirement: Pilot readiness inspection route
The system SHALL expose a backend route for inspecting a pilot task readiness summary before formal checklist matching.

#### Scenario: Readiness route returns current gate status
- **WHEN** a user or frontend requests readiness for an existing pilot task
- **THEN** the system returns the task id, workspace id, current state, preflight readiness, and knowledge-base reference if present

#### Scenario: Readiness route handles missing task
- **WHEN** readiness is requested for an unknown pilot task
- **THEN** the system returns a not-found response without creating a task

### Requirement: Pilot task knowledge-base binding gate
The system SHALL allow a pilot task to bind a workspace-scoped subcontract-team knowledge base before formal material matching.

#### Scenario: Matching is attempted after binding ready knowledge base
- **WHEN** a pilot task has published basis, required master data, and a ready bound knowledge base
- **THEN** formal material matching can proceed after packet intake

#### Scenario: Binding references another workspace
- **WHEN** a knowledge-base binding request references a knowledge base outside the task workspace
- **THEN** the system rejects the binding as not found for that task context

### Requirement: Formal intake/init workflow path
The system SHALL provide a formal initialization workflow path that creates or updates a pilot task before packet matching.

#### Scenario: Intake precedes formal matching
- **WHEN** a user wants to start a real opening-condition pilot from uploaded packet objects
- **THEN** the system initializes the pilot task through the intake/init path before checklist matching is allowed

#### Scenario: Packet intake is domain-orchestrated
- **WHEN** a packet is initialized through the intake/init path
- **THEN** the system records safe task events for initialization and packet acceptance without requiring the frontend to manually sequence multiple domain writes

### Requirement: Task-bound basis traceability
The system SHALL preserve safe task-bound basis traceability after intake/init.

#### Scenario: Published basis has a source object
- **WHEN** the selected basis record includes a safe source object reference or bounded evidence refs
- **THEN** the task-bound basis reference includes that traceability for later report and audit use

### Requirement: Operator-triggered formal execution path
The system SHALL let the opening-condition pilot portal trigger intake/init and formal checklist matching explicitly instead of auto-running formal execution during workspace hydration.

#### Scenario: Workspace context is opened
- **WHEN** the portal loads a workspace
- **THEN** the system may hydrate basis, master-data, knowledge-base, and existing task state, but it SHALL NOT automatically run formal checklist matching

#### Scenario: Operator starts formal execution
- **WHEN** the operator explicitly triggers intake/init and then formal checklist matching
- **THEN** the pilot workflow proceeds through packet-ready, matching, human-review, and report gates using backend task state as the source of truth

### Requirement: Task-bound checklist definition
The system SHALL persist a normalized checklist definition on the opening-condition pilot task before or during formal execution.

#### Scenario: Intake stores checklist definition
- **WHEN** intake/init receives normalized checklist-definition items
- **THEN** the pilot task stores those items as task-owned execution inputs

#### Scenario: Formal match reuses stored checklist definition
- **WHEN** a formal match request omits checklist items and the pilot task already has a stored checklist definition
- **THEN** the backend executes deterministic matching from the stored task-owned checklist definition

### Requirement: Controlled checklist-object adaptation
The system SHALL support a controlled backend adaptation path from a pilot checklist object reference to a task-bound checklist definition.

#### Scenario: Recognized checklist object derives task-owned definition
- **WHEN** intake/init receives a recognized checklist object reference and no explicit checklist-definition items
- **THEN** the backend derives a normalized checklist definition from a controlled template and persists it on the pilot task

#### Scenario: Checklist object is not recognized
- **WHEN** intake/init cannot map the checklist object to a controlled template and the task has no existing checklist definition
- **THEN** the system returns a safe adapter diagnostic and formal matching remains blocked until a checklist definition is provided or derived

### Requirement: Task-owned packet inventory manifest
The system SHALL persist a task-owned packet inventory manifest for opening-condition pilot packets.

#### Scenario: Packet is stored with explicit inventory entries
- **WHEN** intake/init or packet intake receives bounded inventory entries
- **THEN** the pilot packet stores those entries as task-owned packet facts alongside checklist and source object references

#### Scenario: Packet stores ZIP-derived inventory entries
- **WHEN** a packet is accepted without explicit inventory entries and includes a readable ZIP source object
- **THEN** the backend stores the extracted ZIP entry list in the packet inventory manifest and records that resolution in safe diagnostics

#### Scenario: Packet has no usable ZIP manifest input
- **WHEN** a packet is accepted without explicit inventory entries and ZIP manifest extraction is unavailable or fails
- **THEN** the backend derives a bounded default inventory manifest from the submitted source objects and records the fallback reason in safe diagnostics
