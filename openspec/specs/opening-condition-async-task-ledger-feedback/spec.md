## Purpose

Ensure opening-condition operators see a persisted task-ledger run immediately after starting intake, while backend matching and agent-style progress continue from platform-owned task facts.

## Requirements

### Requirement: Bootstrap returns a persisted task before background matching completes
The opening-condition trial bootstrap SHALL support an async mode that returns the persisted task after intake succeeds and before deterministic matching has completed.

#### Scenario: Async bootstrap is requested
- **WHEN** the frontend starts an opening-condition trial bootstrap with async workflow enabled
- **THEN** the backend returns a successful response containing the persisted task, packet, and preflight readiness
- **AND** the response indicates that matching is continuing in the background

#### Scenario: Background matching completes
- **WHEN** the async continuation finishes deterministic checklist matching
- **THEN** the backend updates the same task id with matching events, evidence, human-review queue, and next state

#### Scenario: Background matching fails
- **WHEN** the async continuation cannot complete matching
- **THEN** the backend records a safe failure event on the same task instead of dropping the task from the ledger

### Requirement: Agent console shows new runs immediately
The opening-condition agent console SHALL show and select a newly persisted run as soon as bootstrap intake returns.

#### Scenario: Operator starts parsing
- **WHEN** the operator uploads the three required files and clicks start parsing
- **THEN** the upload dialog closes after the task is persisted
- **AND** the left history ledger contains the new run without removing previous runs
- **AND** the new run is selected in the task detail area

#### Scenario: Selected run is active
- **WHEN** the selected run is still extracting, matching, or otherwise active
- **THEN** the console refreshes that task from the backend until it reaches human review, report ready, archived, failed, or canceled
