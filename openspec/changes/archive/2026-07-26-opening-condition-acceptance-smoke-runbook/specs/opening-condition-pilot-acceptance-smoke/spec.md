## MODIFIED Requirements

### Requirement: Opening-condition pilot acceptance smoke gate
The system SHALL provide a single operator-facing acceptance smoke entry for the opening-condition pilot.

#### Scenario: Operator runs one acceptance command
- **WHEN** an operator or developer needs to verify the opening-condition pilot before or after a trial run
- **THEN** one package-script command executes the existing domain, HTTP, and UI smoke layers in sequence
- **AND** the output identifies which layer passed or failed

#### Scenario: Runbook references the same acceptance entry
- **WHEN** the single-project trial runbook describes preflight or regression verification
- **THEN** it references the same acceptance command and explains the expected smoke layers
