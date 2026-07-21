## MODIFIED Requirements

### Requirement: Report decision ledger contract
The pilot operational API SHALL include bounded human-review decision ledger entries in report package diagnostics when available, including checklist context for checklist-targeted entries.

#### Scenario: Report response includes decision ledger
- **WHEN** report generation succeeds for a pilot task with human-review decisions
- **THEN** the response contains bounded ledger entries suitable for frontend rendering, including target type and ID, checklist name/category when available, reason, status, evidence IDs, reviewer, decided time, and safe note
