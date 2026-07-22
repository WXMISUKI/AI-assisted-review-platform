# opening-condition-report-findings-delivery Specification

## Purpose
TBD - created by archiving change opening-condition-rectification-rerun-and-report-delivery. Update Purpose after archive.
## Requirements
### Requirement: Findings-oriented auxiliary report
The system SHALL render the opening-condition auxiliary report as a findings-oriented delivery view rather than a statistics-only summary.

#### Scenario: Report contains failed or blocked items
- **WHEN** a report-ready task generates a report asset
- **THEN** the report view shows each failed, blocked, or warning item with checklist name, category, problem description, basis reference, risk level, and rectification suggestion

#### Scenario: Report contains human-review outcomes
- **WHEN** the report asset includes human-review decisions
- **THEN** the report view shows which findings were confirmed, corrected, rejected, or deferred by a human reviewer

### Requirement: Rectification handoff summary
The report SHALL provide a concise handoff summary for the next rectification round, including adjacent-run closure status when history is available.

#### Scenario: Current round is not approved
- **WHEN** the report concludes that work should not proceed or requires supplementation
- **THEN** the report view shows the outstanding item count, major blockers, and the expected next operator action for re-submission

#### Scenario: Current round has previous history
- **WHEN** the report view can compare the selected run with a previous archived run
- **THEN** the report view shows rectified, carried-over, newly-added, and pending-human-review counts as part of the handoff summary

### Requirement: Human-readable delivery semantics
The report SHALL present review outcomes in operator-facing language rather than raw internal enum values.

#### Scenario: Findings are rendered for supervisors
- **WHEN** the report view displays findings, risk levels, or handling outcomes
- **THEN** the system shows readable Chinese labels for category, risk level, handling conclusion, and current status
- **AND** the report visually distinguishes blocked, failed, pending-human-review, and not-in-scope items so the operator can scan priorities quickly

#### Scenario: Human review has already resolved the item
- **WHEN** a finding has a latest human review outcome of `confirmed`, `corrected`, or `rejected`
- **THEN** the displayed handling conclusion follows that human review outcome instead of continuing to show the raw `needs_human_review` verdict

