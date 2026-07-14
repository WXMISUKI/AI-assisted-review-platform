# review-session-state Delta

## ADDED Requirements

### Requirement: Reviewer decision activity trail
The review session state SHALL preserve a safe activity trail for backend-owned reviewer actions on the review task aggregate.

#### Scenario: Reviewer action succeeds
- **WHEN** the backend resolves an issue, edits a draft suggestion, adds a manual issue, deletes a manual issue, or completes a review
- **THEN** the returned task snapshot includes a bounded activity record describing the action

#### Scenario: Task is reopened
- **WHEN** a task with reviewer decision activities is reopened
- **THEN** the session snapshot can expose the recent activity trail without recomputing it from issue state

### Requirement: Activity trail remains safe
The reviewer decision activity trail SHALL store only safe business summaries.

#### Scenario: Activity is persisted
- **WHEN** an activity record is appended
- **THEN** it excludes secrets, tokens, prompts, provider traces, private URLs, and unbounded document text
