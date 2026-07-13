## MODIFIED Requirements

### Requirement: Recovered structure snapshot
The review session state SHALL persist a recovered-structure snapshot alongside task progress state.

#### Scenario: Task enters review preparation after OCR hydration
- **WHEN** OCR hydration stores recovered sections and paragraphs on the task aggregate
- **THEN** review-preparation stage snapshots use that recovered structure as their current paragraph and section source

#### Scenario: Task is reopened mid-recovery
- **WHEN** the user refreshes during structure recovery
- **THEN** the session state restores the recovered paragraphs, active section, and current recovery stage
