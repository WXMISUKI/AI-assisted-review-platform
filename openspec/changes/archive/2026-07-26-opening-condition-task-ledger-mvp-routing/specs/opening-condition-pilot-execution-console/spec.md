## ADDED Requirements

### Requirement: Task ledger is the MVP primary entry
The opening-condition portal SHALL present the review task ledger as the primary MVP entry and SHALL treat material intake and checklist detail pages as task-routed execution pages.

#### Scenario: Operator opens opening-condition workspace
- **WHEN** the opening-condition workspace renders
- **THEN** the primary sidebar exposes the task ledger, human review, report archive, and asset governance destinations
- **AND** secondary execution pages are reachable from task-row or selected-task actions rather than as equivalent primary destinations

#### Scenario: Selected task needs a secondary execution page
- **WHEN** the selected task's recommended next action is material intake or checklist detail
- **THEN** the task ledger shows that destination as the selected task's primary continuation action
- **AND** the shell labels the active page as a secondary execution page with a route back to the task ledger

### Requirement: Selected task handoff includes MVP acceptance status
The opening-condition task ledger SHALL show the selected run's backend MVP acceptance snapshot when report diagnostics provide it.

#### Scenario: Selected task has report diagnostics
- **WHEN** a selected task has `reportAsset.packageDiagnostics.mvpAcceptance`
- **THEN** the selected-task handoff shows acceptance status, current owner, next action, read-only state, and stage completion
- **AND** it uses backend diagnostics instead of deriving a conflicting completion label in the UI

#### Scenario: Selected task has no report diagnostics
- **WHEN** a selected task has not generated a report yet
- **THEN** the selected-task handoff falls back to task state, ownership, issue counts, and existing stage progress

### Requirement: Task row report routing remains explicit
The task ledger SHALL make report or archive availability visible from both task rows and the selected-task handoff.

#### Scenario: Report is relevant for selected task
- **WHEN** the selected task is report-ready, has a report asset, or is archived
- **THEN** the selected-task handoff provides a secondary report/archive action
- **AND** the task row continues to expose the recommended next action for the current state
