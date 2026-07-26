## ADDED Requirements

### Requirement: Report diagnostics include MVP acceptance snapshot
The pilot operational API SHALL include a backend-derived MVP acceptance snapshot in report package diagnostics whenever a report asset is generated, exported, archived, or returned with a task.

#### Scenario: Report is generated
- **WHEN** `POST /api/opening-condition/pilot-tasks/:taskId/report` succeeds
- **THEN** the returned report asset package diagnostics include `mvpAcceptance`
- **AND** the snapshot identifies completed pilot steps, current owner, next action, blocking reasons, read-only state, and whether the run has completed the MVP acceptance loop

#### Scenario: Archived report is returned
- **WHEN** an archived task with a report asset is inspected
- **THEN** `mvpAcceptance.completed` is true
- **AND** `mvpAcceptance.readOnly` is true
- **AND** the archive step is marked complete without allowing historical mutation
