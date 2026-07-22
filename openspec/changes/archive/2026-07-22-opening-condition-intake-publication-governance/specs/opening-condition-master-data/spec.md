## ADDED Requirements

### Requirement: Master-data publication queue visibility
The opening-condition portal SHALL distinguish provisional, human-approved, published, and exception master-data records in the operator-facing governance view.

#### Scenario: Operator reviews master-data readiness
- **WHEN** master-data records exist for the selected workspace
- **THEN** the portal groups them into pending confirmation, ready for publication, published, and exception sections
- **AND** each section explains whether the records are already usable by formal checks

### Requirement: Current run master-data snapshot visibility
The opening-condition portal SHALL show which backend facts the current run is currently using.

#### Scenario: Operator verifies current-run master-data facts
- **WHEN** the basis-and-master-data page opens for a selected pilot run
- **THEN** the page shows the current-run master-data facts separately from the full workspace catalog
- **AND** each fact includes type, confirmation state, and safe evidence note where available
