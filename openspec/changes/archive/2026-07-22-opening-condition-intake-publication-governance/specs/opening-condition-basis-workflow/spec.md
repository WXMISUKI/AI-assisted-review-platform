## ADDED Requirements

### Requirement: Basis publication queue visibility
The opening-condition portal SHALL distinguish basis records waiting for confirmation, waiting for publication, already published, and no-longer-active records.

#### Scenario: Operator reviews basis publication readiness
- **WHEN** basis records exist for the selected workspace
- **THEN** the portal groups them into pending confirmation, publish-ready, published, and exception states
- **AND** each group uses operator-facing labels instead of raw status enums

### Requirement: Current run basis snapshot visibility
The opening-condition portal SHALL show which basis version the current run is currently bound to.

#### Scenario: Operator verifies bound basis version
- **WHEN** a pilot run is selected
- **THEN** the basis-and-master-data page highlights the run-bound basis version separately from the overall published basis catalog
