# opening-condition-pilot-execution-console Specification

## Purpose
Define the operator-facing execution console for the opening-condition pilot so trial users can explicitly initialize intake, run formal checklist matching, and inspect blocking reasons without hidden auto-execution.
## Requirements
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
- **THEN** the portal displays those task-owned items ahead of local demo review items, including category, optional subcategory, checklist name, target ID, reason, rule explanation, evidence references, and bounded decision actions for open or deferred items

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
The report archive page SHALL display backend report package diagnostics for repeatable real-sample trials and SHALL surface findings-oriented delivery content for operator handoff.

#### Scenario: Report package exists
- **WHEN** a backend report asset includes package diagnostics
- **THEN** the report page shows the task-owned input summary, matching summary, human-review summary, provider/readiness blockers, report status, archive status, and findings-oriented delivery sections

#### Scenario: Archived package is shown
- **WHEN** the backend task is archived
- **THEN** the report page keeps the package visible, disables report generation, and hides archive action when the report asset is already archived

### Requirement: Report decision ledger rendering
The report archive page SHALL render task-owned human-review decision ledger entries when the backend report package provides them.

#### Scenario: Report package has decision ledger entries
- **WHEN** a backend report asset includes bounded human-review decision ledger entries
- **THEN** the report page shows each entry's checklist name and category when available, target ID, final status, reason, safe note, reviewer, and decided time as part of the delivery summary

### Requirement: Current trial run tracking
The opening-condition execution console SHALL keep operator actions scoped to the currently selected or newly bootstrapped pilot run, while allowing archived runs to be revisited as history.

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

#### Scenario: Archived task becomes read-only history
- **WHEN** the currently displayed backend task is archived
- **THEN** the execution console disables follow-on mutation actions but still allows the operator to inspect the archived run and its report as history

#### Scenario: Archived task becomes read-only
- **WHEN** the currently displayed backend task is archived
- **THEN** the execution console disables formal matching and other follow-on mutation actions
- **AND** the material-intake page defaults to read-only guidance until the operator explicitly enters rerun intake mode

#### Scenario: Start next rectification round
- **WHEN** the operator starts a next rectification round from an archived run
- **THEN** the execution console guides the operator to upload a fresh basis/checklist/material package for a new run-specific task id
- **AND** the archived run is not reinitialized or mutated

#### Scenario: Start next rectification round from the primary entry
- **WHEN** the operator wants to start the next rectification round for an archived run
- **THEN** the report page provides the primary entry into rerun intake mode
- **AND** the material-intake page only opens rerun upload actions after that intent has been explicitly set

### Requirement: Human-review delivery guidance
The opening-condition execution console SHALL show task-owned human-review progress and next action guidance after formal matching.

#### Scenario: Human-review blockers exist
- **WHEN** the backend pilot task has open or deferred human-review items
- **THEN** the console displays blocking count, closed count, task state, and guidance to close blockers before generating the report

#### Scenario: Human-review blockers are closed
- **WHEN** the backend pilot task has no open or deferred human-review items
- **THEN** the console displays that report generation is the next delivery action

### Requirement: Report action gating follows backend state
The report archive page SHALL require backend `report_ready` state before enabling report generation.

#### Scenario: Queue is empty but task is not report ready
- **WHEN** the human-review queue is empty but the backend task state is not `report_ready`
- **THEN** the report generation action remains disabled

#### Scenario: Report ready without existing report
- **WHEN** the backend task state is `report_ready` and no report asset exists
- **THEN** the report generation action is enabled

### Requirement: Execution controls use shared portal state
The opening-condition execution console SHALL rely on the shared portal view model for read-only and mutation gating.

#### Scenario: Archived run is shown in material-intake view
- **WHEN** the selected run is archived
- **THEN** the execution console, intake overview, and upload panel use the shared portal state to determine which controls remain read-only
- **AND** the same archived/current/rerun rule does not need to be redefined separately in each control group

### Requirement: Archived intake actions are fully read-only
The opening-condition execution console SHALL disable every action that would mutate the currently displayed archived run unless the operator has explicitly entered rectification rerun mode.

#### Scenario: Operator opens material-intake page for archived run
- **WHEN** the selected backend task is archived
- **AND** the portal is not in explicit rectification rerun mode
- **THEN** the execution console disables reinitialize, basis publish, master-data confirm, formal matching, and knowledge-base binding actions
- **AND** the intake overview disables its publish and confirm actions as well

#### Scenario: Operator enters rectification rerun mode
- **WHEN** the operator starts the next rectification round from the report page
- **THEN** the archived run remains read-only as history
- **AND** the material-intake page only re-enables actions that create the new run instead of mutating the archived run

### Requirement: Execution console shows action ownership
The opening-condition execution console SHALL show the current run's action owner, next action, due-state, and action reason.

#### Scenario: Operator reviews current execution state
- **WHEN** the material-intake execution console is backed by a current or selected run
- **THEN** it shows who currently owns the next step
- **AND** it explains what action should be completed before the run can advance

