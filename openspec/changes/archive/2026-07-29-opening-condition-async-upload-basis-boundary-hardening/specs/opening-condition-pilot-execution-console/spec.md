## ADDED Requirements

### Requirement: Agent upload draft survives modal close
The opening-condition agent upload entry SHALL keep selected upload files as a temporary page draft while the browser page remains loaded.

#### Scenario: Operator closes upload modal before starting
- **WHEN** the operator selects basis, checklist, and material package files and closes the upload modal without starting parsing
- **THEN** reopening the modal shows the previously selected files
- **AND** the files remain available for starting parsing

#### Scenario: Operator explicitly removes a selected file
- **WHEN** the operator removes a selected upload file from the modal
- **THEN** only that file is cleared from the temporary draft
- **AND** parsing remains disabled until all required files are selected again

#### Scenario: Parsing starts successfully
- **WHEN** the operator starts parsing with all required files selected
- **THEN** the temporary draft is cleared for the next new-review upload

### Requirement: Agent upload starts as asynchronous task feedback
The opening-condition agent upload entry SHALL close the modal and show task-ledger feedback as soon as parsing is started.

#### Scenario: Operator starts parsing
- **WHEN** all required files are selected and the operator clicks start parsing
- **THEN** the upload modal closes immediately
- **AND** the sidebar history shows a run-specific pending task row with circular progress
- **AND** the selected task detail shows an agent timeline step indicating upload/bootstrap is in progress

#### Scenario: Backend bootstrap succeeds
- **WHEN** the backend returns the real pilot task for the started parsing request
- **THEN** the pending task row is replaced by that backend task using the same task id
- **AND** the selected detail continues to show the backend-owned timeline

#### Scenario: Backend bootstrap fails
- **WHEN** upload or backend bootstrap fails after the optimistic row is shown
- **THEN** the pending row is removed or marked failed
- **AND** the visible platform status explains the failure without leaving the modal stuck in a parsing state

### Requirement: Report workbench uses collision-free UI row keys
The opening-condition report and rectification workbench SHALL render finding rows with UI-unique keys even when backend checklist or finding ids repeat.

#### Scenario: Duplicate finding ids exist
- **WHEN** two report findings or rectification rows share the same backend id
- **THEN** both rows render with distinct React keys
- **AND** the displayed backend id and report data remain unchanged
