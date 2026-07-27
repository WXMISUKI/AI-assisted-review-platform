# opening-condition-pilot-execution-console Delta

## ADDED Requirements

### Requirement: Agent-style review console is the default opening-condition entry
The opening-condition portal SHALL present an agent-style review console before exposing dense execution ledgers or governance diagnostics.

#### Scenario: Operator opens the workspace overview
- **WHEN** the operator enters the opening-condition platform
- **THEN** the primary content shows `开工条件核查智能体`
- **AND** it shows a low-density new-review entry with review scope selection and upload guidance
- **AND** dense task metrics, rectification comparison, provider diagnostics, and asset governance are not the first visual focus

### Requirement: Review scope selection distinguishes completeness from compliance
The agent console SHALL make `资料完整性` required and `资料合规性` optional.

#### Scenario: New review scope is shown
- **WHEN** the agent console renders
- **THEN** `资料完整性` is selected and cannot be unchecked
- **AND** `资料合规性` can be selected by the operator
- **AND** the UI explains that compliance findings must come from workflow or backend-normalized review outputs

### Requirement: Three-material upload modal starts task creation
The agent console SHALL collect contract/qualification basis, checklist, and material package before creating a pilot review task.

#### Scenario: Required files are incomplete
- **WHEN** fewer than three material groups have been selected
- **THEN** the start/parse action remains disabled
- **AND** the modal explains which material groups are required

#### Scenario: Required files are complete
- **WHEN** contract/qualification basis, checklist, and material package have all been selected
- **THEN** the operator can start parsing
- **AND** the portal uses the existing real-file bootstrap path to create or initialize the backend pilot task

### Requirement: Project-scoped task history stays compact
The agent console SHALL show project-scoped historical review tasks with a compact progress indicator.

#### Scenario: Task history exists
- **WHEN** backend tasks exist for the selected workspace
- **THEN** the console shows task rows using the checklist file name when available
- **AND** each row shows state, next action, and a progress percentage without exposing full diagnostics

### Requirement: Task detail uses file-preview and progress split layout
The selected task detail SHALL separate source material inspection from agent progress and report handoff.

#### Scenario: Operator selects a task
- **WHEN** a task row is selected
- **THEN** the detail area shows a left-side material list and preview region
- **AND** it shows a right-side progress timeline and report handoff region
- **AND** displayed facts are derived from platform task records rather than frontend-invented findings

### Requirement: Compliance review findings remain source-bound
The agent console SHALL NOT generate deep compliance findings from frontend-only assumptions.

#### Scenario: Compliance scope is selected
- **WHEN** the operator selects `资料合规性`
- **THEN** the console may show that deep review is requested
- **BUT** detailed compliance findings are only shown when they exist in backend check items, evidence, human-review items, or report findings

#### Scenario: Only completeness scope is selected
- **WHEN** the operator runs or views a review with only `资料完整性`
- **THEN** report or progress copy must not imply deep compliance review has been performed
