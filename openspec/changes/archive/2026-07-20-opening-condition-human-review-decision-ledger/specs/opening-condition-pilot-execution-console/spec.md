## ADDED Requirements

### Requirement: Report decision ledger rendering
The report archive page SHALL render task-owned human-review decision ledger entries when the backend report package provides them.

#### Scenario: Report package has decision ledger entries
- **WHEN** a backend report asset includes bounded human-review decision ledger entries
- **THEN** the report page shows each entry's target, final status, reason, safe note, reviewer, and decided time as part of the delivery summary
