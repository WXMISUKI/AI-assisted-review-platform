# opening-condition-run-snapshot-kernel Specification

## Purpose
Provide one shared operator-facing fact model for selected runs, historical read-only snapshots, and rectification rerun entry semantics across report/history views.

## Requirements
### Requirement: Shared run snapshot semantics
The system SHALL derive one shared run snapshot for workspace report and archive views.

#### Scenario: Task ledger consumes the same selected-run snapshot
- **WHEN** the workspace task ledger needs previous-run summary, closure comparison, or rerun-entry semantics
- **THEN** it consumes the same shared run snapshot derivation used by report and history views
- **AND** it does not maintain a second page-local implementation of previous-run or closure-diff rules

#### Scenario: Operator opens a run-backed delivery page
- **WHEN** the page is backed by current workspace run history
- **THEN** the page derives one selected run, one visible history list, and one current-vs-historical snapshot state
- **AND** both report and archive views can render from that same snapshot instead of recalculating separate semantics

#### Scenario: Selected run is historical
- **WHEN** the selected run is not the current mutable run
- **THEN** the snapshot marks it as read-only history
- **AND** mutation actions are not exposed from that historical selection

### Requirement: Normalized closure-state derivation
The system SHALL derive rectification closure and pending-human summaries from final operator-facing disposition.

#### Scenario: Page-level closure helper would drift
- **WHEN** a task-ledger or report page needs closure comparison data
- **THEN** the comparison is derived from the shared run snapshot kernel
- **AND** the platform avoids duplicating closure-state business logic in page-local helper functions

#### Scenario: Human review already rejected or corrected an item
- **WHEN** the latest human decision for a checklist item is `rejected`, `confirmed`, or `corrected`
- **THEN** closure summaries use that final operator-facing state
- **AND** the item is not counted as pending human judgement unless its latest review remains open or deferred

#### Scenario: Operator compares current round with previous archived round
- **WHEN** the selected run has a previous archived run in the same workspace
- **THEN** the closure comparison labels items as rectified, carried over, newly added, or pending human judgement using normalized final disposition rules
