## ADDED Requirements

### Requirement: Findings-oriented auxiliary report
The system SHALL render the opening-condition auxiliary report as a findings-oriented delivery view rather than a statistics-only summary.

#### Scenario: Report contains failed or blocked items
- **WHEN** a report-ready task generates a report asset
- **THEN** the report view shows each failed, blocked, or warning item with checklist name, category, problem description, basis reference, risk level, and rectification suggestion

#### Scenario: Report contains human-review outcomes
- **WHEN** the report asset includes human-review decisions
- **THEN** the report view shows which findings were confirmed, corrected, rejected, or deferred by a human reviewer

### Requirement: Rectification handoff summary
The report SHALL provide a concise handoff summary for the next rectification round.

#### Scenario: Current round is not approved
- **WHEN** the report concludes that work should not proceed or requires supplementation
- **THEN** the report view shows the outstanding item count, major blockers, and the expected next operator action for re-submission
