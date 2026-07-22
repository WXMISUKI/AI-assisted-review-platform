## MODIFIED Requirements

### Requirement: Rectification handoff summary
The report SHALL provide a concise handoff summary for the next rectification round, including adjacent-run closure status when history is available.

#### Scenario: Current round is not approved
- **WHEN** the report concludes that work should not proceed or requires supplementation
- **THEN** the report view shows the outstanding item count, major blockers, and the expected next operator action for re-submission

#### Scenario: Current round has previous history
- **WHEN** the report view can compare the selected run with a previous archived run
- **THEN** the report view shows rectified, carried-over, newly-added, and pending-human-review counts as part of the handoff summary
