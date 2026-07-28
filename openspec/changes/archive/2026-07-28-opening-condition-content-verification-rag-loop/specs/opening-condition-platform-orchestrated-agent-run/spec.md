## ADDED Requirements

### Requirement: Agent run records content verification before review readiness
The platform SHALL record content verification diagnostics after packet inventory preparation and before deriving final review readiness when packet content facts are available.

#### Scenario: Content verification completes automatically
- **WHEN** a task has checklist items, packet inventory, and packet content facts
- **THEN** the task records content verification and semantic matching events before report readiness or human-review waiting state is derived
- **AND** the browser does not need to call Dify, OCR Worker, or MaxKB directly

#### Scenario: Content verification is incomplete
- **WHEN** a task lacks content facts for matched packet files
- **THEN** the task records safe diagnostics that only filename or manifest-level matching was available
- **AND** items that need substantive content judgement remain eligible for human review
