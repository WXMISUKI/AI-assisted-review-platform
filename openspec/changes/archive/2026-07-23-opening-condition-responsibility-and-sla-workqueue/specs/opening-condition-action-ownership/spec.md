## MODIFIED Requirements

### Requirement: Workspace action summary card
The system SHALL expose the current run's owner, next action, due-state, and action reason as a reusable summary card across operator views.

#### Scenario: Operator needs a route to the next page
- **WHEN** a page renders the derived action ownership data for the current run
- **THEN** the summary can also expose the recommended page and primary action label for continuing the workflow
- **AND** that routing guidance remains consistent with the current run state
