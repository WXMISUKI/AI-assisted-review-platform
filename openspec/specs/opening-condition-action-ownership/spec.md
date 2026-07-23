# opening-condition-action-ownership Specification

## Purpose
TBD - created by archiving change opening-condition-action-ownership-and-readonly-guardrails. Update Purpose after archive.
## Requirements
### Requirement: Run-level action ownership
The system SHALL derive one operator-facing action ownership summary for the current opening-condition pilot run.

#### Scenario: Run is waiting for preflight completion
- **WHEN** the current run is blocked on basis, master data, knowledge base, or intake gate confirmation
- **THEN** the system shows the current owner as the operator role responsible for completing preflight confirmation
- **AND** the next action states which gate must be completed before formal matching

#### Scenario: Run is awaiting human review
- **WHEN** the current run has open or deferred human-review items
- **THEN** the system shows the current owner as the supervising review role
- **AND** the next action states that human-review blockers must be closed before report generation

#### Scenario: Run is report ready
- **WHEN** the current run has no blocking human-review items and is in `report_ready`
- **THEN** the system shows the current owner as the operator responsible for report delivery
- **AND** the next action states that report generation or archive is the current delivery step

#### Scenario: Run is archived
- **WHEN** the selected run is archived
- **THEN** the system marks the run as read-only with no active owner for mutation
- **AND** the next action shifts to starting a new rectification rerun from the report page when more materials must be submitted
- **AND** action ownership does not advertise direct mutation of the archived run

### Requirement: Trial due-state derivation
The system SHALL derive a bounded due-state hint for the current run from its stage and latest update time.

#### Scenario: Run is still within trial window
- **WHEN** the selected run is in an active processing stage and its derived due window has not expired
- **THEN** the system shows a non-overdue due-state hint for the operator

#### Scenario: Run exceeds trial window
- **WHEN** the selected run remains in an active stage after its derived trial window expires
- **THEN** the system shows the run as overdue
- **AND** the next action summary highlights that the current owner has delayed the handoff

### Requirement: Workspace action summary card
The system SHALL expose the current run's owner, next action, due-state, and action reason as a reusable summary card across operator views.

#### Scenario: Operator opens a run-backed page
- **WHEN** the workspace has a current or selected backend pilot run
- **THEN** the page can render a common action summary block using the derived action ownership data

#### Scenario: Operator needs a route to the next page
- **WHEN** a page renders the derived action ownership data for the current run
- **THEN** the summary can also expose the recommended page and primary action label for continuing the workflow
- **AND** that routing guidance remains consistent with the current run state

#### Scenario: Action summary is operator-readable
- **WHEN** the action summary is rendered on workspace, human-review, or report delivery views
- **THEN** it shows readable labels for current owner, next action, action reason, due state, due window, recommended page, and primary action
- **AND** it does not expose unreadable internal placeholders or raw state-only labels as the main guidance
