## ADDED Requirements

### Requirement: Single-project trial bootstrap API
The system SHALL provide a domain-level bootstrap API for running a real opening-condition pilot from previously uploaded basis, checklist, and material-packet object references.

#### Scenario: Bootstrap creates a pilot task from uploaded object refs
- **WHEN** the operator submits workspace context, a basis object ref, a checklist object ref, and at least one material-packet object ref
- **THEN** the backend creates or updates the published basis, trial master data, subcontract knowledge-base binding, pilot task, packet, readiness summary, and bounded intake diagnostics

#### Scenario: Bootstrap reuses storage upload channel
- **WHEN** trial bootstrap runs
- **THEN** it accepts safe object refs from the existing upload channel and does not accept raw file bytes or server-local file paths

#### Scenario: Bootstrap extracts ZIP inventory
- **WHEN** the material packet object is a readable ZIP with a storage key
- **THEN** the backend extracts a bounded ZIP manifest and stores packet inventory entries for matching and operator review

### Requirement: Trial bootstrap provider binding
The system SHALL bind the configured MaxKB provider proxy as safe support metadata during trial bootstrap when available.

#### Scenario: MaxKB provider proxy is ready
- **WHEN** MaxKB is selected, configured, and has a default knowledge id
- **THEN** the trial knowledge base includes a safe MaxKB provider ref with `knowledgeId` and `syncStatus=ready`

#### Scenario: MaxKB provider proxy is not ready
- **WHEN** MaxKB is missing, disabled, degraded, or has no default knowledge id
- **THEN** the trial knowledge base is still created as platform metadata but readiness reports the provider support as provisional or blocked

### Requirement: Trial bootstrap remains operator-confirmed
The system SHALL keep trial bootstrap results as platform-owned operator-confirmed facts, not automated approvals.

#### Scenario: Trial master data is seeded
- **WHEN** the bootstrap seeds personnel or equipment master data for the trial
- **THEN** the records are marked with safe notes explaining they are trial operator-confirmed records and must be replaced by formal extraction/confirmation before production use

#### Scenario: Matching still routes uncertainty to human review
- **WHEN** the operator runs formal matching after bootstrap
- **THEN** missing, ambiguous, visual, or authorization-risk items continue to create human-review tasks instead of being auto-approved by the bootstrap
