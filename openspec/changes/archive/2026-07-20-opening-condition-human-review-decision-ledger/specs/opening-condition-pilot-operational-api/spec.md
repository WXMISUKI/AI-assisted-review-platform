## ADDED Requirements

### Requirement: Report decision ledger contract
The pilot operational API SHALL include bounded human-review decision ledger entries in report package diagnostics when available.

#### Scenario: Report response includes decision ledger
- **WHEN** report generation succeeds for a pilot task with human-review decisions
- **THEN** the response contains bounded ledger entries suitable for frontend rendering and archived replay
