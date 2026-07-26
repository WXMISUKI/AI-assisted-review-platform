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

#### Scenario: Historical run detail does not expose rerun entry
- **WHEN** the operator is inspecting a non-current historical round
- **THEN** the report page keeps that round read-only
- **AND** it does not expose the primary rectification-rerun action for that historical selection

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

#### Scenario: Operator opens workspace overview
- **WHEN** the workspace overview is backed by a current or selected run
- **THEN** it can consume the same shared action ownership data as the execution console
- **AND** it shows the operator which page should be opened next to continue the run

### Requirement: MVP closure path visibility
The opening-condition portal SHALL show the current run's progress against the minimum MVP closure loop.

#### Scenario: Operator reviews current MVP progress
- **WHEN** an opening-condition pilot task is selected
- **THEN** the portal shows whether intake, formal matching, human review, report/export, archive, and rerun readiness have been reached
- **AND** the portal identifies the recommended next MVP page

#### Scenario: Operator opens a non-MVP governance page
- **WHEN** the operator opens a governance-oriented page during MVP validation
- **THEN** the portal explains that the page is not the primary MVP path and provides a route back to the recommended MVP step

### Requirement: MVP completion definition
The opening-condition MVP SHALL be considered minimally runnable when one run can be initialized, matched, reviewed, reported, exported or ready for export, archived, and followed by a new rerun.

#### Scenario: Current run is archived
- **WHEN** a pilot run is archived with a report asset
- **THEN** the MVP status shows the run as closed and points the operator to report history or next-round rerun

### Requirement: Review task workbench
The opening-condition portal SHALL provide a task-list workbench as the primary MVP entry for pilot runs.

#### Scenario: Operator opens workspace overview
- **WHEN** a workspace has current or historical opening-condition pilot runs
- **THEN** the overview shows each run as a review task row with run id, review target, state, current owner, next action, issue counts, report status, updated time, and recommended action

#### Scenario: Operator opens recommended task action
- **WHEN** the operator clicks a task row's primary action
- **THEN** the portal navigates to the recommended execution page for that run state

#### Scenario: No run exists
- **WHEN** the selected workspace has no pilot run
- **THEN** the workbench guides the operator to the material-intake page to create the first review task

### Requirement: Task row issue summary
The opening-condition task workbench SHALL summarize AI findings and human-review needs without exposing internal provider diagnostics.

#### Scenario: Matching has produced check items
- **WHEN** a pilot task contains check items or human-review queue items
- **THEN** the task row shows counts for total check items, blocking or failed findings, and open human-review items

#### Scenario: Report exists
- **WHEN** a pilot task has a generated report asset
- **THEN** the task row shows report readiness and whether the task is archived

### Requirement: Secondary execution pages remain reachable from task rows
The opening-condition task workbench SHALL keep routing operators to secondary execution pages when those pages are the recommended next action.

#### Scenario: Task requires intake or matching
- **WHEN** a task row recommends material intake or checklist matching
- **THEN** the operator can open that secondary page from the row action even though it is not a primary sidebar entry

#### Scenario: Task requires review or reporting
- **WHEN** a task row recommends human review or report archive
- **THEN** the operator can open the corresponding primary destination from the row action

### Requirement: Selected task detail handoff
The opening-condition task workbench SHALL show a selected-task detail handoff for the task row currently being inspected.

#### Scenario: Operator opens a workbench with tasks
- **WHEN** the workbench has one or more task rows
- **THEN** the newest or current task is selected by default
- **AND** the detail handoff shows the selected task's stage progress, current owner, next action, issue counts, human-review count, report status, and read-only state

#### Scenario: Operator selects another task row
- **WHEN** the operator selects a different task row
- **THEN** the detail handoff updates to that selected task
- **AND** historical archived tasks remain marked as read-only

### Requirement: Selected task action routing
The opening-condition selected-task detail handoff SHALL provide clear action routing for the selected task.

#### Scenario: Operator continues the next action
- **WHEN** the operator clicks the detail handoff's primary action
- **THEN** the portal navigates to the selected task's recommended execution page

#### Scenario: Report or archive is relevant
- **WHEN** the selected task has a report-ready, report-generated, or archived state
- **THEN** the detail handoff provides a report/archive action that routes to the reports page

### Requirement: Task ledger is the MVP primary entry
The opening-condition portal SHALL present the review task ledger as the primary MVP entry and SHALL treat material intake and checklist detail pages as task-routed execution pages.

#### Scenario: Operator opens opening-condition workspace
- **WHEN** the opening-condition workspace renders
- **THEN** the primary sidebar exposes the task ledger, human review, report archive, and asset governance destinations
- **AND** secondary execution pages are reachable from task-row or selected-task actions rather than as equivalent primary destinations

#### Scenario: Selected task needs a secondary execution page
- **WHEN** the selected task's recommended next action is material intake or checklist detail
- **THEN** the task ledger shows that destination as the selected task's primary continuation action
- **AND** the shell labels the active page as a secondary execution page with a route back to the task ledger

### Requirement: Selected task handoff includes MVP acceptance status
The opening-condition task ledger SHALL show the selected run's backend MVP acceptance snapshot when report diagnostics provide it.

#### Scenario: Selected task has report diagnostics
- **WHEN** a selected task has `reportAsset.packageDiagnostics.mvpAcceptance`
- **THEN** the selected-task handoff shows acceptance status, current owner, next action, read-only state, and stage completion
- **AND** it uses backend diagnostics instead of deriving a conflicting completion label in the UI

#### Scenario: Selected task has no report diagnostics
- **WHEN** a selected task has not generated a report yet
- **THEN** the selected-task handoff falls back to task state, ownership, issue counts, and existing stage progress

### Requirement: Task row report routing remains explicit
The task ledger SHALL make report or archive availability visible from both task rows and the selected-task handoff.

#### Scenario: Report is relevant for selected task
- **WHEN** the selected task is report-ready, has a report asset, or is archived
- **THEN** the selected-task handoff provides a secondary report/archive action
- **AND** the task row continues to expose the recommended next action for the current state

### Requirement: Selected task issue summary
The opening-condition task ledger SHALL show a compact issue summary for the selected task using existing task facts.

#### Scenario: Selected task has findings
- **WHEN** the selected task contains failed, blocked, rejected, warning, or needs-human-review findings
- **THEN** the selected-task detail shows prioritized issue rows with check item title, category, disposition, risk, evidence status, and a bounded reason
- **AND** the summary caps visible rows while keeping the full checklist and report pages as detail destinations

#### Scenario: Selected task has no findings
- **WHEN** the selected task has no reportable findings
- **THEN** the selected-task detail shows a safe empty state and keeps the recommended next action visible

### Requirement: Selected task pending human-review summary
The opening-condition task ledger SHALL distinguish unresolved human-review items from AI-detected issues.

#### Scenario: Human-review queue has open items
- **WHEN** the selected task has open or deferred human-review items
- **THEN** the selected-task detail shows the pending review count, representative review items, and a route to the human-review page

#### Scenario: Human-review queue is closed
- **WHEN** the selected task has no open or deferred human-review items
- **THEN** the selected-task detail indicates that no blocking human-review item remains

### Requirement: Selected task evidence and report handoff summary
The opening-condition task ledger SHALL expose evidence and report handoff readiness without duplicating the full report page.

#### Scenario: Evidence or report asset exists
- **WHEN** the selected task has matched evidence or a report asset
- **THEN** the selected-task detail shows evidence count, report status, MVP acceptance status when available, and a report/archive route when relevant

### Requirement: Task detail issue focus routing
The opening-condition task ledger SHALL allow operators to navigate from a selected issue summary row to a focused checklist detail view.

#### Scenario: Operator opens a checklist issue from task detail
- **WHEN** the operator clicks an issue summary row action in the selected-task detail
- **THEN** the portal navigates to the checklist detail page
- **AND** the destination page indicates which checklist item is focused
- **AND** the matching checklist item row is visually distinguished without changing task data

### Requirement: Task detail human-review focus routing
The opening-condition task ledger SHALL allow operators to navigate from a selected pending-review row to a focused human-review view.

#### Scenario: Operator opens a pending review from task detail
- **WHEN** the operator clicks a pending human-review row action in the selected-task detail
- **THEN** the portal navigates to the human-review page
- **AND** the destination page indicates which review item is focused
- **AND** the matching review card is visually distinguished without submitting a decision

### Requirement: Focus context remains local and clearable
The opening-condition portal SHALL treat focused checklist and human-review ids as transient navigation context.

#### Scenario: Operator uses a different navigation route
- **WHEN** the operator navigates through a generic sidebar or task primary action rather than an item-level focus action
- **THEN** the portal clears stale focused item context
