# review-session-state Specification

## Purpose

Persist the workbench view context on the review task aggregate so reopen flows can restore the same section, paragraph, and issue focus the reviewer was using.

## Requirements

### Requirement: Persisted workbench view context
The system SHALL persist a workbench view context alongside the review task aggregate.

#### Scenario: Reviewer changes focus
- **WHEN** the reviewer explicitly selects a new issue or reading position in the workbench
- **THEN** the review session service can store the active section, active paragraph, and active issue on the task aggregate

#### Scenario: Task is reopened
- **WHEN** a user reopens the task later
- **THEN** the session snapshot can restore the persisted workbench view context

### Requirement: Backend-replaceable focus contract
The workbench view context SHALL remain compatible with future backend session state.

#### Scenario: Backend returns view context
- **WHEN** a backend session payload contains section, paragraph, and issue focus metadata
- **THEN** the session layer can map it into the same task-level view context used by the mock flow
