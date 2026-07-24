## MODIFIED Requirements

### Requirement: Workspace action summary card
The system SHALL expose the current run's owner, next action, due-state, and action reason as a reusable summary card across operator views.

#### Scenario: Historical snapshot renders action ownership
- **WHEN** a page renders action ownership for a selected historical run
- **THEN** the summary preserves that run's owner/next-action semantics in read-only form
- **AND** the page can distinguish those historical semantics from the current run's live mutation context

#### Scenario: Shared snapshot drives routing guidance
- **WHEN** report and archive views derive action ownership for selected runs
- **THEN** the routing guidance remains consistent with the shared run-snapshot semantics
- **AND** the action summary does not imply that a historical selection can mutate the current workspace run
