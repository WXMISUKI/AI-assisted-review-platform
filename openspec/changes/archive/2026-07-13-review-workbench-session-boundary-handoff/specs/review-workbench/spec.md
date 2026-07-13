## ADDED Requirements

### Requirement: Session-backed workbench initialization
The review workbench SHALL initialize its active section and paragraph context from the review session snapshot when one is available.

#### Scenario: Session snapshot exists
- **WHEN** the workbench opens with a session snapshot
- **THEN** the initial active section and paragraph focus can come from that snapshot rather than the page inferring everything from raw props

#### Scenario: Session snapshot does not exist
- **WHEN** the workbench opens without a session snapshot
- **THEN** the workbench continues to initialize from recovered structure and paragraph props as it does today
