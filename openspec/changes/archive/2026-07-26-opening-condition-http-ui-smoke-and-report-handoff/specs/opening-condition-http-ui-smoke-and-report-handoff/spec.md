## ADDED Requirements

### Requirement: HTTP smoke protects archived run immutability
The opening-condition MVP SHALL keep an HTTP smoke gate that verifies archived runs reject follow-on mutations and preserve immutable history.

#### Scenario: Archived task rejects follow-on mutations
- **WHEN** HTTP smoke archives a completed opening-condition task
- **THEN** follow-on match, report, and intake-init requests against that archived task fail with safe invalid-state responses
- **AND** the archived task remains unchanged in the task list response

#### Scenario: New run is isolated from archived history
- **WHEN** HTTP smoke creates a new run-specific task id after archiving a prior run
- **THEN** the new run reaches packet-ready state independently
- **AND** the archived run keeps its own task id, event history, and archived state

### Requirement: UI smoke protects read-only archived controls
The opening-condition MVP SHALL keep a lightweight UI smoke gate that verifies archived runs remain read-only in the portal.

#### Scenario: Archived run is rendered
- **WHEN** the UI smoke renders an archived current or selected run
- **THEN** the portal does not expose archived-task mutation actions as valid controls
- **AND** the screen clearly indicates the run is historical read-only history

#### Scenario: Rectification rerun entry is explicit
- **WHEN** the UI smoke renders the rectification rerun entry
- **THEN** the portal clearly distinguishes the new-run upload path from the archived history view
- **AND** the rerun entry is only exposed as a new-run creation path

### Requirement: Report handoff remains readable across current and historical runs
The opening-condition MVP SHALL keep the report handoff path explicit for both current and historical runs.

#### Scenario: Current run is inspected
- **WHEN** the report page renders the current run
- **THEN** the page shows the current run's report handoff and next action clearly

#### Scenario: Historical run is inspected
- **WHEN** the report page renders a historical archived run
- **THEN** the page remains read-only and keeps the rerun entry tied to the current archived context
