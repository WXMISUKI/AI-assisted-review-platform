## ADDED Requirements

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
