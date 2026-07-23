## MODIFIED Requirements

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
