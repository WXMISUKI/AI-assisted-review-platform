## ADDED Requirements

### Requirement: Opening-condition pilot acceptance smoke gate
The system SHALL provide a retained smoke gate that verifies the single-project opening-condition pilot delivery chain from intake through archive without requiring external providers.

#### Scenario: Smoke verifies human-review blocking and report readiness
- **WHEN** the smoke creates a task, publishes required readiness inputs, intakes a checklist and material packet, and runs formal matching with at least one unresolved item
- **THEN** report generation is blocked until all open or deferred human-review items are resolved
- **AND** resolving the blocking queue moves the task to `report_ready`

#### Scenario: Smoke verifies report and archive completion
- **WHEN** the smoke generates a report for a `report_ready` task and archives it
- **THEN** the task is archived, the report asset is archived, package diagnostics are retained, and archive status is recorded

#### Scenario: Smoke verifies archived run immutability
- **WHEN** the smoke attempts to rerun matching, regenerate a report, or reinitialize intake against an archived task
- **THEN** each mutation is rejected with a safe invalid-state response and the archived task remains unchanged

#### Scenario: Smoke verifies independent next-run creation
- **WHEN** the smoke creates a new run-specific task id for the same workspace after a prior run was archived
- **THEN** the new run can reach packet-ready state without mutating the archived run or reusing its task id

#### Scenario: Smoke is runnable from package scripts
- **WHEN** a developer runs the opening-condition smoke npm script
- **THEN** the retained test executes the pilot acceptance scenarios without requiring browser interaction or provider secrets
