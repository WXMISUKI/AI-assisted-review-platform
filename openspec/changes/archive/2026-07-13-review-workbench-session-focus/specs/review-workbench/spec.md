# review-workbench Specification

## Purpose

Keep the review workbench anchored to the session snapshot when the task is reopened, including the active issue focus that matches the current review context.

## Requirements

### Requirement: Session-backed workbench initialization
The review workbench SHALL initialize its active section, paragraph context, and issue focus from the review session snapshot when one is available.

#### Scenario: Session snapshot exists
- **WHEN** the workbench opens with a session snapshot
- **THEN** the initial active section, paragraph, and issue focus can come from that snapshot rather than the page inferring everything from raw props

#### Scenario: Session snapshot does not exist
- **WHEN** the workbench opens without a session snapshot
- **THEN** the workbench continues to initialize from recovered structure and paragraph props as it does today

#### Scenario: Matching issue exists for the current paragraph
- **WHEN** the session snapshot points to a current paragraph that has one or more review issues
- **THEN** the workbench can focus the issue anchored to that paragraph instead of defaulting to the first issue in the task

#### Scenario: No matching issue exists
- **WHEN** the current paragraph does not have a matching issue
- **THEN** the workbench falls back to the current section's first issue or the first available issue
