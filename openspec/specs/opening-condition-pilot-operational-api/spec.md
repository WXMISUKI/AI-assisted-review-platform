# opening-condition-pilot-operational-api Specification

## Purpose
Define the backend API and frontend contract needed to operate the single-project opening-condition pilot through task readiness, subcontract-team knowledge-base management, and task knowledge-base binding.
## Requirements
### Requirement: Pilot operational task API
The system SHALL expose opening-condition pilot task operations that allow the frontend to list, create or update, inspect, and evaluate readiness for single-project pilot tasks.

#### Scenario: Pilot tasks are listed
- **WHEN** the frontend requests opening-condition pilot tasks
- **THEN** the system returns bounded task summaries and local store metadata without exposing secrets, private URLs, raw prompts, or unbounded document text

#### Scenario: Pilot task is upserted
- **WHEN** the frontend submits a pilot task with workspace context
- **THEN** the system persists the normalized task and returns its derived preflight readiness

#### Scenario: Pilot task readiness is inspected
- **WHEN** the frontend requests readiness for a pilot task
- **THEN** the system returns basis, master-data, knowledge-base, material-packet, blocking-reason, and next-action fields derived by the backend

### Requirement: Pilot knowledge-base operational API
The system SHALL expose workspace-scoped subcontract-team knowledge-base operations for listing, upserting, and binding knowledge-base records to pilot tasks.

#### Scenario: Knowledge bases are listed by workspace
- **WHEN** the frontend requests knowledge bases for a workspace
- **THEN** the system returns only records scoped to that workspace

#### Scenario: Knowledge base is upserted
- **WHEN** the frontend submits a subcontract-team knowledge-base record
- **THEN** the system normalizes the record, redacts unsafe fields, preserves optional provider references, and returns the stored record

#### Scenario: Knowledge base is bound to a task
- **WHEN** the frontend binds a workspace knowledge base to a pilot task
- **THEN** the system updates the task knowledge-base reference and returns the refreshed preflight readiness

### Requirement: Pilot operational frontend contract
The system SHALL provide typed frontend client functions and a concise operational panel for pilot readiness and knowledge-base support.

#### Scenario: Backend pilot status is displayed
- **WHEN** the opening-condition portal is rendered
- **THEN** the frontend can display backend-backed task state, readiness, and knowledge-base provider support without relying only on mock packet data

#### Scenario: Backend pilot APIs fail
- **WHEN** a pilot operational API call fails or returns an error payload
- **THEN** the frontend displays a bounded operational error and keeps the rest of the portal usable

### Requirement: Operational intake/init contract
The system SHALL expose typed backend and frontend contracts for opening-condition pilot intake/init orchestration.

#### Scenario: Frontend initializes intake through one call
- **WHEN** the opening-condition portal needs to initialize a pilot task from object references
- **THEN** the frontend can call one typed intake/init API instead of composing generic task upsert, packet intake, and knowledge-base bind calls by itself

#### Scenario: Intake result explains orchestration outcome
- **WHEN** the intake/init API returns
- **THEN** the frontend receives task state, readiness, and bounded basis, master-data, and knowledge-base orchestration diagnostics suitable for operator display

### Requirement: Manual execution console contract
The system SHALL provide a portal-facing manual execution contract for opening-condition pilot task refresh, intake/init, and formal matching.

#### Scenario: Portal shows explicit execution actions
- **WHEN** a user opens the opening-condition review page
- **THEN** the frontend can refresh task state, initialize intake, and trigger formal matching through explicit controls instead of implicit workspace-side effects

#### Scenario: Portal renders backend task execution state
- **WHEN** a pilot task exists
- **THEN** the frontend uses backend task state, readiness, check items, evidence, human-review queue, and report state as the preferred execution view

### Requirement: Checklist-definition persistence contract
The system SHALL expose intake/init and formal-match contracts that support task-bound checklist-definition persistence.

#### Scenario: Frontend sends checklist definition once
- **WHEN** the portal initializes pilot intake from its current checklist adapter
- **THEN** the intake/init API accepts the normalized checklist-definition items and stores them on the task

#### Scenario: Match uses stored task definition
- **WHEN** the portal triggers formal matching after intake/init
- **THEN** the frontend may omit checklist items and rely on the task-owned checklist definition already persisted by the backend

### Requirement: Checklist adapter diagnostics contract
The system SHALL expose bounded checklist adapter diagnostics through the opening-condition pilot intake/init contract.

#### Scenario: Intake returns checklist adapter outcome
- **WHEN** the intake/init API returns
- **THEN** the payload includes whether checklist-definition resolution came from direct input, controlled template derivation, existing-task fallback, or unresolved manual action

#### Scenario: Frontend defaults to backend adaptation
- **WHEN** the portal initializes a known pilot checklist object
- **THEN** the frontend may omit checklist-definition items and rely on the backend checklist-object adapter as the default path

### Requirement: Packet inventory operational contract
The system SHALL expose bounded packet inventory fields and diagnostics through the opening-condition pilot operational contracts.

#### Scenario: Frontend initializes packet intake with inventory support
- **WHEN** the portal initializes or updates a pilot packet
- **THEN** the typed contract may include bounded packet inventory entries in addition to checklist and source object references

#### Scenario: Intake or packet result returns ZIP manifest diagnostics
- **WHEN** the backend accepts packet intake
- **THEN** the response or task event includes safe packet inventory diagnostics such as resolution, entry count, bounded entry-name samples, and fallback reason when ZIP manifest extraction was unavailable

### Requirement: Pilot completion frontend contract
The frontend contract SHALL expose typed calls for backend human-review decisions, report generation, and task archive as part of the single-project opening-condition pilot completion loop.

#### Scenario: Human review decision is submitted
- **WHEN** the portal submits a human-review decision for a pilot task
- **THEN** the typed client posts the decision, actor, and bounded safe note to the backend human-review decision endpoint and returns the updated task payload

#### Scenario: Report is generated
- **WHEN** the portal requests report generation for a pilot task
- **THEN** the typed client calls the backend report endpoint and returns the report asset and refreshed task

#### Scenario: Task is archived
- **WHEN** the portal requests archive for a pilot task
- **THEN** the typed client calls the backend archive endpoint and returns the archived task payload

### Requirement: Completion-loop operator diagnostics
The pilot completion loop SHALL display bounded operator diagnostics for completion actions without exposing provider secrets, raw OCR text, raw prompts, or private object URLs.

#### Scenario: Completion action succeeds
- **WHEN** a human-review decision, report generation, or archive action succeeds
- **THEN** the portal displays a concise success message and refreshed backend state

#### Scenario: Completion action fails
- **WHEN** a human-review decision, report generation, or archive action fails
- **THEN** the portal displays the backend-safe error message and keeps the rest of the opening-condition workspace usable

### Requirement: Trial package operational contract
The pilot operational API SHALL return bounded trial package summary fields on task, intake, match, report, and archive responses when available.

#### Scenario: Task payload includes trial package
- **WHEN** the frontend fetches a pilot task after real intake
- **THEN** the response includes trial package summary fields without exposing secrets, raw OCR text, raw prompts, private URLs, or unbounded document text

#### Scenario: Mutations refresh trial package
- **WHEN** intake, matching, human-review decision, report generation, or archive mutation succeeds
- **THEN** the returned task contains an updated trial package summary consistent with the new task state

### Requirement: Report package diagnostics contract
The report API SHALL include bounded package diagnostics in generated report assets and SHALL support findings-oriented delivery fields.

#### Scenario: Report response includes package diagnostics
- **WHEN** report generation succeeds for a real trial task
- **THEN** the response contains report asset diagnostics covering input object filenames, checklist/evidence/human-review counts, provider readiness, blocking reasons, and disclaimer

#### Scenario: Report response includes findings delivery
- **WHEN** report generation succeeds for a real trial task
- **THEN** the response contains report asset diagnostics covering input object filenames, checklist/evidence/human-review counts, provider readiness, blocking reasons, disclaimer, and structured finding summaries

#### Scenario: Archived task rejects report regeneration
- **WHEN** a report-generation request targets an archived task
- **THEN** the API returns a safe `invalid_state` response and does not mutate the task

### Requirement: Current workspace task discovery contract
The pilot operational API SHALL allow the frontend to discover the current runnable task for a workspace without mutating archived tasks, and SHALL expose sufficient run history metadata for repeatable rectification review.

#### Scenario: Task list can be used to resolve current run
- **WHEN** the frontend requests the pilot task list
- **THEN** the response includes task state, workspace context, and timestamps sufficient to select the latest non-archived task for a workspace

#### Scenario: Multiple runs exist in a workspace
- **WHEN** the frontend requests the pilot task list for a workspace
- **THEN** the response includes task state, workspace context, timestamps, and report availability sufficient to select the latest runnable run and render archived history

#### Scenario: Archived task rejects formal matching
- **WHEN** a formal-match request targets an archived task
- **THEN** the API returns a safe `invalid_state` response and does not mutate the archived task

### Requirement: Report decision ledger contract
The pilot operational API SHALL include bounded human-review decision ledger entries in report package diagnostics when available, including checklist context for checklist-targeted entries.

#### Scenario: Report response includes decision ledger
- **WHEN** report generation succeeds for a pilot task with human-review decisions
- **THEN** the response contains bounded ledger entries suitable for frontend rendering, including target type and ID, checklist name/category when available, reason, status, evidence IDs, reviewer, decided time, and safe note

### Requirement: Issue-taxonomy fields in pilot task payload
The pilot operational API SHALL expose structured issue-taxonomy fields on reportable opening-condition findings when available.

#### Scenario: Frontend fetches current task after matching
- **WHEN** a pilot task contains failed, blocked, warning, or needs-human-review findings
- **THEN** the task payload can include issue taxonomy id, issue label, risk level, legal basis, rectification requirement, and human conclusion fields for those findings

### Requirement: Structured report-package findings contract
The report-generation API SHALL return a structured findings package suitable for report rendering and future exporters.

#### Scenario: Report generation succeeds
- **WHEN** the frontend requests report generation for a pilot task
- **THEN** the response includes bounded structured findings and grouped delivery summaries in the report asset package diagnostics
- **AND** the contract remains safe for local rendering without exposing secrets, raw prompts, raw OCR text, or private object URLs

### Requirement: Report document export API
The pilot operational API SHALL expose a backend-owned report DOCX export endpoint for opening-condition report assets.

#### Scenario: Frontend requests DOCX export
- **WHEN** a pilot task has a generated report asset
- **THEN** the frontend can call a typed backend endpoint to generate a DOCX report through the configured HTTP tools adapter
- **AND** the response includes the normalized export result and refreshed task/report asset when export succeeds

#### Scenario: Archived run is exported
- **WHEN** the selected run is archived and has a report asset
- **THEN** the export endpoint can generate a document from the archived report facts without mutating checklist findings, human-review decisions, or archive state

#### Scenario: Report export fails safely
- **WHEN** the adapter is not configured, times out, or rejects the input
- **THEN** the API returns a safe error payload and does not expose raw HTML, raw provider output, credentials, or private URLs

