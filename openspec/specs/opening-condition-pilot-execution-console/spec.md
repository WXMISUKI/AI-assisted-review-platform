# opening-condition-pilot-execution-console Specification

## Purpose
Define the operator-facing execution console for the opening-condition pilot so trial users can explicitly initialize intake, run formal checklist matching, and inspect blocking reasons without hidden auto-execution.
## Requirements
### Requirement: Explicit pilot execution actions
The system SHALL expose explicit operator actions for real-file trial bootstrap, pilot intake/init, formal matching, and state refresh in the opening-condition review portal.

#### Scenario: Operator initializes pilot intake
- **WHEN** the pilot task is not yet packet-ready or the operator wants to reinitialize the task
- **THEN** the portal allows an explicit intake/init action and displays the resulting readiness summary

#### Scenario: Operator bootstraps from real files
- **WHEN** the operator selects basis, checklist, and material ZIP files for the single-project trial
- **THEN** the portal uploads them through the existing object-storage channel and calls the domain bootstrap API with safe object refs

#### Scenario: Operator starts formal matching
- **WHEN** the pilot task has a packet-bound task context and the operator chooses to run formal matching
- **THEN** the portal triggers backend checklist matching explicitly instead of doing so automatically during workspace sync

#### Scenario: Operator refreshes execution state
- **WHEN** the operator requests refresh
- **THEN** the portal reloads current task state and readiness without mutating the task

### Requirement: Backend-first execution rendering
The system SHALL prefer backend pilot-task execution data over local mock packet summaries whenever a pilot task exists.

#### Scenario: Task-backed check items exist
- **WHEN** backend pilot task check items, evidence, human-review queue, or report asset are present
- **THEN** the portal renders those backend-backed results as the primary execution view

#### Scenario: Backend task is unavailable
- **WHEN** no backend pilot task is found or the backend is unavailable
- **THEN** the portal may fall back to the local demo packet while clearly preserving the ability to initialize a real pilot task

### Requirement: Pilot completion loop actions
The opening-condition pilot execution console SHALL expose backend-backed human-review decision, report generation, and archive actions after formal matching has produced task-owned results.

#### Scenario: Human review blockers are displayed
- **WHEN** a backend pilot task has human-review queue items
- **THEN** the portal displays those task-owned items ahead of local demo review items and provides bounded decision actions for open or deferred items

#### Scenario: Operator decides a human review item
- **WHEN** the operator confirms, corrects, rejects, or defers a backend human-review item
- **THEN** the portal calls the backend decision API, refreshes the pilot task, and displays the updated blocking count or task state

#### Scenario: Operator generates report
- **WHEN** the backend pilot task has no blocking human-review items and is in a report-ready state
- **THEN** the portal allows the operator to generate a backend report asset and renders that asset as the primary report summary

#### Scenario: Operator archives report
- **WHEN** the backend pilot task has a ready report asset
- **THEN** the portal allows the operator to archive the task and shows the archived task state without mutating local demo packet data

### Requirement: Backend-backed execution result rendering
The opening-condition review page SHALL prefer backend pilot-task check items and evidence over local demo packet results whenever a pilot task exists.

#### Scenario: Backend check items are present
- **WHEN** the pilot task contains check items from formal matching
- **THEN** the review page renders those items as the primary material-check list with evidence and human-review references

#### Scenario: Backend evidence is present
- **WHEN** the pilot task contains evidence records from formal matching
- **THEN** the review page renders task-owned evidence records as the primary traceability list

#### Scenario: Backend task has no results yet
- **WHEN** the pilot task exists but has no check items or evidence
- **THEN** the review page may still display local demo packet content as fallback context while preserving explicit backend execution actions

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
