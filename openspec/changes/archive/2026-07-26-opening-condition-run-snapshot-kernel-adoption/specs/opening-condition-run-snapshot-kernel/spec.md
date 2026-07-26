## MODIFIED Requirements

### Requirement: Shared run snapshot semantics
The system SHALL derive one shared run snapshot for workspace report and archive views.

#### Scenario: Task ledger consumes the same selected-run snapshot
- **WHEN** the workspace task ledger needs previous-run summary, closure comparison, or rerun-entry semantics
- **THEN** it consumes the same shared run snapshot derivation used by report and history views
- **AND** it does not maintain a second page-local implementation of previous-run or closure-diff rules

### Requirement: Normalized closure-state derivation
The system SHALL derive rectification closure and pending-human summaries from final operator-facing disposition.

#### Scenario: Page-level closure helper would drift
- **WHEN** a task-ledger or report page needs closure comparison data
- **THEN** the comparison is derived from the shared run snapshot kernel
- **AND** the platform avoids duplicating closure-state business logic in page-local helper functions
