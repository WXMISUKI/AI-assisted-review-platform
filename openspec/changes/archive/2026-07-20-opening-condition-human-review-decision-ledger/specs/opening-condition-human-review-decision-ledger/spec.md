## ADDED Requirements

### Requirement: Report package human-review decision ledger
The system SHALL include a bounded human-review decision ledger in opening-condition pilot report packages.

#### Scenario: Report is generated after human review
- **WHEN** the operator generates a report for a `report_ready` pilot task
- **THEN** the report package contains bounded ledger entries derived from task-owned human-review items, including target, final status, reason, safe note, reviewer, decided time, and evidence references

#### Scenario: Ledger remains safe and bounded
- **WHEN** the report package ledger is generated
- **THEN** it excludes raw OCR text, raw prompts, private URLs, and unbounded document content

#### Scenario: Archived report keeps the ledger
- **WHEN** the pilot task is archived after report generation
- **THEN** the archived report package keeps the same human-review decision ledger without later mutation
