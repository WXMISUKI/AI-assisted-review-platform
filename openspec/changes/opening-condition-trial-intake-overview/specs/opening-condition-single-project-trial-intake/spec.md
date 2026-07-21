## MODIFIED Requirements

### Requirement: Repeatable real-file intake diagnostics
The single-project trial intake SHALL make real-file intake repeatable by returning and displaying bounded diagnostics for uploaded basis, checklist, and material packet objects.

#### Scenario: Material intake shows task-owned overview
- **WHEN** a real-file bootstrap succeeds or the operator refreshes the current run
- **THEN** the material-intake page shows the current run id, task state, bound basis version, required master data summary, knowledge-base summary, checklist-definition resolution, inventory count, provider readiness, blocking reasons, and next action
