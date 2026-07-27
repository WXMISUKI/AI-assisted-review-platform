## MODIFIED Requirements

### Requirement: Agent-style review console is the default opening-condition entry
The opening-condition portal SHALL present a low-noise agent-style review console before exposing dense execution ledgers or governance diagnostics.

#### Scenario: Operator opens the workspace overview
- **WHEN** the operator enters the opening-condition platform with no selected task
- **THEN** the primary content shows `开工条件核查智能体`
- **AND** the left navigation shows only the current project context, `新建审核`, and compact project-scoped `历史审核记录`
- **AND** dense task metrics, rectification comparison, provider diagnostics, asset governance, and static sample findings are not the first visual focus

#### Scenario: Operator changes project context
- **WHEN** the operator selects another available project context
- **THEN** the current project card and history list switch to that project
- **AND** no historical task, check item, evidence, human review, or report from another project is displayed

### Requirement: Review scope selection distinguishes completeness from compliance
The agent console SHALL make `资料完整性` required and `资料合规性` optional, and SHALL carry the selection into task creation.

#### Scenario: New review scope is shown
- **WHEN** the agent console renders
- **THEN** `资料完整性` is selected and cannot be unchecked
- **AND** `资料合规性` can be selected by the operator
- **AND** the UI explains that compliance findings must come from workflow or backend-normalized review outputs

#### Scenario: Compliance scope is submitted
- **WHEN** the operator selects `资料合规性` and starts a new review
- **THEN** the bootstrap request contains `reviewScope: "completeness_and_compliance"`
- **AND** the task can report that compliance review was requested
- **BUT** no detailed compliance finding is rendered unless it exists in backend check items, evidence, human-review items, or report findings

#### Scenario: Completeness-only scope is submitted
- **WHEN** the operator leaves `资料合规性` unselected and starts a new review
- **THEN** the bootstrap request contains `reviewScope: "completeness"`
- **AND** progress and report copy explicitly state that deep compliance review was not performed

### Requirement: Three-material upload modal starts task creation
The agent console SHALL collect contract/qualification basis, checklist, and material package before creating a pilot review task.

#### Scenario: Required files are incomplete
- **WHEN** fewer than three material groups have been selected or an upload has failed
- **THEN** the `开始解析` action remains disabled
- **AND** the modal explains which material groups are still required

#### Scenario: Required files are complete
- **WHEN** contract/qualification basis, checklist, and material package have all been uploaded successfully
- **THEN** the operator can start parsing
- **AND** the portal uses the existing real-file bootstrap path to create or initialize the backend pilot task
- **AND** the modal closes only after the backend returns a successful task

### Requirement: Project-scoped task history stays compact
The agent console SHALL show only backend tasks for the selected project context with a compact progress indicator.

#### Scenario: No task history exists
- **WHEN** the backend returns no task for the selected project
- **THEN** the left history area shows an explicit empty state
- **AND** no static sample task, G15 report, check item, evidence, or human-review count is shown

#### Scenario: Task history exists
- **WHEN** backend tasks exist for the selected project
- **THEN** the console shows task rows using the checklist file name when available
- **AND** each row shows state and a progress percentage without exposing full diagnostics
- **AND** the task title and progress are derived from the selected backend task

### Requirement: Task detail uses file-preview and progress split layout
The selected task detail SHALL be entered explicitly and separate source material inspection from agent progress and report handoff.

#### Scenario: Operator selects a task
- **WHEN** the operator clicks a history task row
- **THEN** the primary area changes from the new-review home to a task detail view
- **AND** the detail view shows a left-side material list and preview region
- **AND** it shows a right-side progress timeline and report handoff region
- **AND** a clear return action takes the operator back to the new-review home

#### Scenario: No task is selected
- **WHEN** the operator has not selected a history task
- **THEN** the detail view is not rendered
- **AND** the home view does not show placeholder findings or static file objects

### Requirement: Compliance review findings remain source-bound
The agent console SHALL NOT generate deep compliance findings from frontend-only assumptions.

#### Scenario: Compliance scope is selected
- **WHEN** the operator selects `资料合规性`
- **THEN** the console may show that deep review is requested
- **BUT** detailed compliance findings are only shown when they exist in backend check items, evidence, human-review items, or report findings

#### Scenario: Only completeness scope is selected
- **WHEN** the operator runs or views a review with only `资料完整性`
- **THEN** report or progress copy must not imply deep compliance review has been performed

### Requirement: Opening-condition default fixtures are clean
The opening-condition frontend SHALL NOT seed a historical G15 review packet or fabricated findings when no backend task exists.

#### Scenario: Fresh frontend with no backend task
- **WHEN** the opening-condition portal loads and the task API returns an empty list
- **THEN** the current project context may display the configured project name
- **AND** basis versions, evidence, master data, check items, human reviews, report findings, and report assets are empty
- **AND** the home view renders the first-review empty state

#### Scenario: Backend task is available
- **WHEN** the task API returns a task for the selected project
- **THEN** task facts are rendered from that backend task
- **AND** the clean default fixture does not override or supplement backend facts
