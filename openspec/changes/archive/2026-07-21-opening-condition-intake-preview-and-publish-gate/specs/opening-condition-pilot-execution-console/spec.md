## MODIFIED Requirements

### Requirement: Explicit pilot execution actions
The system SHALL expose explicit operator actions for real-file trial bootstrap, pilot intake/init, intake preview confirmation, basis publication, master-data confirmation, formal matching, and state refresh in the opening-condition review portal.

#### Scenario: Operator initializes pilot intake
- **WHEN** the pilot task is not yet packet-ready or the operator wants to reinitialize the task
- **THEN** the portal allows an explicit intake/init action and displays the resulting readiness summary

#### Scenario: Operator bootstraps from real files
- **WHEN** the operator selects basis, checklist, and material ZIP files for the single-project trial
- **THEN** the portal uploads them through the existing object-storage channel and calls the domain bootstrap API with safe object refs

#### Scenario: Operator confirms intake preview gate
- **WHEN** the current run still has unpublished basis or unconfirmed required master data
- **THEN** the execution console provides explicit publish or confirm actions before formal matching

#### Scenario: Operator starts formal matching
- **WHEN** the pilot task has a packet-bound task context and readiness is formally ready
- **THEN** the portal triggers backend checklist matching explicitly instead of doing so automatically during workspace sync

#### Scenario: Operator refreshes execution state
- **WHEN** the operator requests refresh
- **THEN** the portal reloads current task state and readiness without mutating the task

### Requirement: Current trial run tracking
The opening-condition execution console SHALL keep operator actions scoped to the currently selected or newly bootstrapped pilot run.

#### Scenario: Refresh follows current run id
- **WHEN** the portal has a current backend pilot task
- **THEN** the refresh action reloads that task id and its readiness instead of always using the workspace base task id

#### Scenario: Workspace switch resets current run
- **WHEN** the operator switches to another opening-condition workspace
- **THEN** the portal clears the current run and returns to that workspace base task lookup

#### Scenario: Real upload reports new run id
- **WHEN** real-file bootstrap creates a new run-specific task
- **THEN** the material-intake page displays the returned task id and state as the active pilot run

#### Scenario: Refresh prefers current runnable run
- **WHEN** the current workspace has both archived tasks and a newer non-archived run task
- **THEN** the execution console refreshes onto the latest non-archived run instead of staying bound to an archived task

#### Scenario: Archived task becomes read-only
- **WHEN** the currently displayed backend task is archived
- **THEN** the execution console disables formal matching and other follow-on mutation actions and guides the operator to upload and initialize a new run

### Requirement: Report action gating follows backend state
The report archive page SHALL require backend `report_ready` state before enabling report generation.

#### Scenario: Queue is empty but task is not report ready
- **WHEN** the human-review queue is empty but the backend task state is not `report_ready`
- **THEN** the report generation action remains disabled

#### Scenario: Report ready without existing report
- **WHEN** the backend task state is `report_ready` and no report asset exists
- **THEN** the report generation action is enabled
