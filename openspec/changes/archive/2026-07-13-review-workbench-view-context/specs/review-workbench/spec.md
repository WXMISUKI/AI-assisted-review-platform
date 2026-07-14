# review-workbench Specification

## Purpose

Keep the review workbench anchored to the persisted session context when the task is reopened, including the active issue focus that matches the current review context.

## Requirements

### Requirement: Session-backed workbench initialization
The review workbench SHALL initialize its active section, paragraph context, and active issue focus from the review session snapshot when one is available.

#### Scenario: Session snapshot exists
- **WHEN** the workbench opens with a session snapshot
- **THEN** the initial active section, paragraph, and issue focus can come from that snapshot rather than the page inferring everything from raw props

#### Scenario: Session snapshot does not exist
- **WHEN** the workbench opens without a session snapshot
- **THEN** the workbench continues to initialize from recovered structure and paragraph props as it does today

### Requirement: Session-backed issue focus persistence
The review workbench SHALL persist explicit issue focus changes back to the review session boundary.

#### Scenario: User focuses an issue
- **WHEN** the user clicks an issue card or navigates to a different issue
- **THEN** the workbench can store that issue as the current active issue in the review session context

#### Scenario: Task is reopened after focus change
- **WHEN** the user refreshes or reopens the workbench later
- **THEN** the previously focused issue remains the active issue when a matching issue still exists
