## ADDED Requirements

### Requirement: Trial diagnostics rendering
The opening-condition pilot execution console SHALL render backend trial package diagnostics when a pilot task has real-sample intake or execution data.

#### Scenario: Operator reviews intake diagnostics
- **WHEN** a pilot task has checklist-definition, inventory, or provider readiness diagnostics
- **THEN** the material-intake page displays bounded resolution status, entry counts, fallback reasons, and blocking reasons ahead of local demo content

#### Scenario: Operator reviews execution diagnostics
- **WHEN** formal matching or human review has run
- **THEN** the material-check, human-review, and report pages display backend counts and latest trial package state without requiring raw event inspection

### Requirement: Report package rendering
The report archive page SHALL display backend report package diagnostics for repeatable real-sample trials.

#### Scenario: Report package exists
- **WHEN** a backend report asset includes package diagnostics
- **THEN** the report page shows the task-owned input summary, matching summary, human-review summary, provider/readiness blockers, report status, and archive status

#### Scenario: Archived package is shown
- **WHEN** the backend task is archived
- **THEN** the report page keeps the package visible, disables report generation, and hides archive action when the report asset is already archived
