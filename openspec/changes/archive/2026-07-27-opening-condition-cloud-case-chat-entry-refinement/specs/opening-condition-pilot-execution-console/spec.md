## MODIFIED Requirements

### Requirement: Agent-style review console is the default opening-condition entry
The opening-condition portal SHALL present a single low-noise chat-style new-review entry before exposing task details or governance diagnostics.

#### Scenario: Operator opens the new-review home
- **WHEN** the operator enters the opening-condition platform with no selected task
- **THEN** the primary content shows `开工条件核查智能体`
- **AND** it shows review scope selection and one central upload/input entry
- **AND** it does not render separate shell topbar, project context pills, hero, upload, history, metrics, responsibility, or advanced-ledger panels as peer-level home sections

#### Scenario: Operator selects an existing task
- **WHEN** the operator selects a task from the left history list
- **THEN** the primary content changes to the task detail workspace
- **AND** the new-review chat entry is no longer the primary content

### Requirement: Project selector has no duplicate project copy
The opening-condition sidebar SHALL present the current project through the selector without repeating the same project name in a separate paragraph.

#### Scenario: Operator views the project selector
- **WHEN** the opening-condition sidebar renders
- **THEN** the project selector lists the available current project contexts
- **AND** the sidebar does not render a duplicate current-project-name paragraph below the selector

### Requirement: Review scope selection remains visible in the chat entry
The chat-style home SHALL make `资料完整性` required and `资料合规性` optional without moving the business logic into a new client-only path.

#### Scenario: Operator views review scope
- **WHEN** the chat-style home renders
- **THEN** `资料完整性` is selected and cannot be unchecked
- **AND** `资料合规性` can be selected
- **AND** the selected scope continues to feed the existing three-material bootstrap flow

### Requirement: Chat entry opens the existing three-material upload flow
The central chat-style entry SHALL open the existing upload modal instead of duplicating upload or task-creation logic.

#### Scenario: Operator starts a new review
- **WHEN** the operator clicks the central upload/input entry
- **THEN** the existing three-material upload modal opens
- **AND** the modal still requires contract/qualification basis, checklist, and material package before `开始解析` is enabled
- **AND** the file inputs remain selectable while required files are still missing
- **AND** the existing `reviewScope` value is submitted through the real bootstrap path
