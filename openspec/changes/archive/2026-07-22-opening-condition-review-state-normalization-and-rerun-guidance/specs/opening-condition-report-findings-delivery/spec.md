## MODIFIED Requirements

### Requirement: Human-readable delivery semantics
The report SHALL present review outcomes in operator-facing language rather than raw internal enum values.

#### Scenario: Findings are rendered for supervisors
- **WHEN** the report view displays findings, risk levels, or handling outcomes
- **THEN** the system shows readable Chinese labels for category, risk level, handling conclusion, and current status
- **AND** the report visually distinguishes blocked, failed, pending-human-review, and not-in-scope items so the operator can scan priorities quickly

#### Scenario: Human review has already resolved the item
- **WHEN** a finding has a latest human review outcome of `confirmed`, `corrected`, or `rejected`
- **THEN** the displayed handling conclusion follows that human review outcome instead of continuing to show the raw `needs_human_review` verdict
