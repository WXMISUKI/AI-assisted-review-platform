## ADDED Requirements

### Requirement: Archived retry bootstrap handling
The single-project trial intake SHALL create a fresh pilot run when retrying real-file bootstrap after the prior run has been archived.

#### Scenario: Current task is archived before upload
- **WHEN** the browser real-file intake panel receives an archived current pilot task
- **THEN** it generates a run-specific task id instead of reusing `oc-pilot-{workspaceId}`

#### Scenario: Current task is not archived before upload
- **WHEN** the browser real-file intake panel has no current task or a non-archived current pilot task
- **THEN** it may use the workspace base task id or current task id for bootstrap according to the existing intake behavior
