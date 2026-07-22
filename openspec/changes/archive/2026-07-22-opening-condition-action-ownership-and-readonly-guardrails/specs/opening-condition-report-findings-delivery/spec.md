## ADDED Requirements

### Requirement: Report handoff ownership summary
The report SHALL show the current run's owner, next action, and due-state as part of the delivery handoff.

#### Scenario: Current run still requires follow-up
- **WHEN** the selected run is current and still has unresolved findings or pending delivery actions
- **THEN** the report view shows who currently owns the follow-up
- **AND** it states what the next required action is for advancing or restarting the review loop

#### Scenario: Archived run is viewed as history
- **WHEN** the selected run is archived
- **THEN** the report view shows that the archived run is read-only history
- **AND** it states that the next action, if any, is to start the next rectification rerun rather than mutate the archived run
