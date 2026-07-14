# review-completion-results Delta

## ADDED Requirements

### Requirement: Result preview shows reviewer activity provenance
The result preview SHALL show recent reviewer decision activities when they are available on the completed task.

#### Scenario: Completed task has activities
- **WHEN** the result preview opens for a task with reviewer decision activities
- **THEN** the page displays recent safe activity summaries alongside the result asset

#### Scenario: Completed task has no activities
- **WHEN** no reviewer decision activities are available
- **THEN** the result preview remains usable and does not block result viewing
