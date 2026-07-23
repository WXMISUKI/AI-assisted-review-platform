## MODIFIED Requirements

### Requirement: Human-review ownership guidance
The system SHALL present human-review work as an explicit responsibility handoff rather than only a list of blockers.

#### Scenario: Queue contains pending and deferred items
- **WHEN** the current run contains open and deferred human-review items
- **THEN** the human-review page groups those items separately from resolved items
- **AND** it explains that both pending and deferred groups still block report delivery

#### Scenario: Queue is fully closed
- **WHEN** all open or deferred human-review items are closed
- **THEN** the page shows that responsibility has moved to report delivery
- **AND** it points the operator to the report page as the next primary action
