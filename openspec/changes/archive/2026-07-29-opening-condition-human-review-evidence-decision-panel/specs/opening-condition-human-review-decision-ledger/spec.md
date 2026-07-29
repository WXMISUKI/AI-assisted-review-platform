## ADDED Requirements

### Requirement: Workbench exposes decision ledger state
The selected-task workbench SHALL expose a safe summary of the decision-ledger state for the active human-review item.

#### Scenario: Decision has been recorded
- **WHEN** a human-review item has reviewer, decision time, status, or safe note fields
- **THEN** the workbench shows those bounded fields in the decision pane
- **AND** the existing final report ledger remains the authoritative report package record

#### Scenario: Decision is still pending
- **WHEN** a human-review item is open or deferred
- **THEN** the workbench shows that the item is waiting for operator judgement before final report generation
