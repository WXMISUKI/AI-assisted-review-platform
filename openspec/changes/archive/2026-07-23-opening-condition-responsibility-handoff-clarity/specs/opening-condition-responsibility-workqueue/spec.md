## MODIFIED Requirements

### Requirement: Workspace responsibility workqueue
The system SHALL expose a workspace-level responsibility workqueue for the current opening-condition run.

#### Scenario: Operator opens workspace overview
- **WHEN** the selected workspace has a current or selected run
- **THEN** the overview shows the current owner, next action, due-state, blocker count, and recommended page
- **AND** it provides a primary action that routes the operator to the most relevant page for continuing that run

#### Scenario: Workqueue explains delivery impact
- **WHEN** the responsibility workqueue is shown
- **THEN** it explains whether the run is waiting for intake, formal matching, human review, report delivery, archival history, or exception recovery
- **AND** the primary action is visually presented as the single recommended continuation path for that run context

### Requirement: Human-review priority grouping
The system SHALL organize human-review work by operator-facing processing priority rather than only by raw queue order.

#### Scenario: Human-review queue contains mixed statuses
- **WHEN** the current run has open, deferred, and resolved human-review items
- **THEN** the human-review page groups them into pending, deferred-but-blocking, and resolved sections
- **AND** it makes clear which groups still block report delivery

#### Scenario: Human-review item is displayed
- **WHEN** a human-review item appears in a priority group
- **THEN** the item shows checklist name, category, status, reason, expected evidence hints, linked evidence, and safe note when available
- **AND** only open or deferred items expose decision actions
