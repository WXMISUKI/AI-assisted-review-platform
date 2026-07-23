## MODIFIED Requirements

### Requirement: Findings-oriented auxiliary report
The system SHALL render the opening-condition auxiliary report as a findings-oriented delivery view rather than a statistics-only summary.

#### Scenario: Report contains failed or blocked items
- **WHEN** a report-ready task generates a report asset
- **THEN** the report view shows each failed, blocked, or warning item with checklist name, category, problem description, basis reference, risk level, and rectification suggestion

#### Scenario: Report contains human-review outcomes
- **WHEN** the report asset includes human-review decisions
- **THEN** the report view shows which findings were confirmed, corrected, rejected, or deferred by a human reviewer

#### Scenario: Report contains mixed delivery priorities
- **WHEN** the selected run contains blocked, failed, pending-human-review, and warning findings
- **THEN** the report view groups those findings by operator-facing delivery priority instead of one undifferentiated list
- **AND** each group remains visually scannable as part of the report handoff
