## ADDED Requirements

### Requirement: Provider-derived basis preview source
The system SHALL accept safe provider-derived structured output as an additional source for basis preview refresh.

#### Scenario: Provider output refreshes preview facts
- **WHEN** provider-derived structured facts are submitted for a basis source object
- **THEN** the system normalizes those facts into the same preview fact keys used by deterministic metadata and bounded-text extraction
- **AND** the preview remains provisional until human confirmation

#### Scenario: Provider missing fields are explicit
- **WHEN** provider output omits required basis preview fields
- **THEN** the system records missing field keys and a next action that asks the operator to review or supplement the preview
