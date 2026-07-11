## ADDED Requirements

### Requirement: Hydrated structure visibility during review preparation
The system SHALL surface the recovered document structure in the review-preparation context once OCR hydration has produced sections and paragraphs.

#### Scenario: Recovered structure is available
- **WHEN** a task has a hydrated recovered structure snapshot
- **THEN** the review-preparation view can display the source format, section count, paragraph count, and current section

#### Scenario: Recovered structure is reopened
- **WHEN** a user reopens an in-progress task that already has recovered structure
- **THEN** the detail context can restore the last known section and paragraph summary without recomputing OCR
