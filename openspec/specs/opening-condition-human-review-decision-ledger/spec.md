# opening-condition-human-review-decision-ledger Specification

## Purpose
Define a bounded human-review decision ledger for opening-condition pilot report packages.

## Requirements
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

### Requirement: Workbench exposes decision ledger state
The selected-task workbench SHALL expose a safe summary of the decision-ledger state for the active human-review item.

#### Scenario: Decision has been recorded
- **WHEN** a human-review item has reviewer, decision time, status, or safe note fields
- **THEN** the workbench shows those bounded fields in the decision pane
- **AND** the existing final report ledger remains the authoritative report package record

#### Scenario: Decision is still pending
- **WHEN** a human-review item is open or deferred
- **THEN** the workbench shows that the item is waiting for operator judgement before final report generation
