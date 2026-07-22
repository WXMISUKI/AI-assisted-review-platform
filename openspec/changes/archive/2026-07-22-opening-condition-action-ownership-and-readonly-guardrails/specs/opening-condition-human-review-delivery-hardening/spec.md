## ADDED Requirements

### Requirement: Human-review ownership guidance
The system SHALL present human-review work as an explicit responsibility handoff rather than only a list of blockers.

#### Scenario: Human-review queue has open items
- **WHEN** the current run contains open or deferred human-review items
- **THEN** the human-review page shows the supervising review role as the current owner
- **AND** it states that closing those items is the required next action before report delivery

#### Scenario: Human-review queue is fully closed
- **WHEN** all open or deferred human-review items are closed
- **THEN** the human-review page shows that ownership has moved to report delivery
- **AND** it points the operator to generate the report as the next action
