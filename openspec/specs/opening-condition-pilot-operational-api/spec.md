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

#### Scenario: Intake or packet result returns inventory diagnostics
- **WHEN** the backend accepts packet intake
- **THEN** the response or task event includes safe packet inventory diagnostics such as resolution, entry count, and bounded entry-name samples
