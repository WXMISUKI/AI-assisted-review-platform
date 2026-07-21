## ADDED Requirements

### Requirement: Report package decision traceability
The real-sample trial report package SHALL preserve bounded human-review decision traceability for archived replay.

#### Scenario: Report package contains decision ledger
- **WHEN** a report package is generated for a real-sample pilot task
- **THEN** the package diagnostics include bounded human-review decision ledger entries in addition to aggregate human-review counts
