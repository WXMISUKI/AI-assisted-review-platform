## ADDED Requirements

### Requirement: Trial report handoff checklist
The opening-condition report SHALL render a trial handoff checklist that makes the selected run's delivery result understandable without reading internal task events.

#### Scenario: Report handoff is generated from platform facts
- **WHEN** a report asset exists for the selected run
- **THEN** the report page shows a handoff checklist derived from task-owned check items, evidence, human-review decisions, package diagnostics, and run history
- **AND** it does not rely on raw provider output as the source of final delivery status

#### Scenario: Report explains failed and rejected findings
- **WHEN** a finding is failed, blocked, or rejected by human review
- **THEN** the report handoff shows the checklist item name, parent category, missing or non-compliant file reason, expected evidence hints, risk level, and rectification suggestion

#### Scenario: Report explains resolved findings
- **WHEN** a finding has been confirmed or corrected by human review
- **THEN** the report handoff shows that the item has been manually resolved and keeps the reviewer note visible as part of the decision ledger

### Requirement: Historical report detail entry
The opening-condition report SHALL allow operators to inspect the complete details of historical archived rounds without mutating them.

#### Scenario: Operator opens archived round detail
- **WHEN** the operator selects an archived historical round
- **THEN** the report page shows the full selected-run report facts, findings, decision ledger, closure comparison, and archive status
- **AND** no mutation action for that archived run is exposed

#### Scenario: Operator compares current and previous round
- **WHEN** the selected run has a previous archived round
- **THEN** the report page shows which prior findings are resolved, carried over, newly added, or still pending human judgement
