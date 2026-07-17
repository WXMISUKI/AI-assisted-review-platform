## ADDED Requirements

### Requirement: Knowledge-base operational records
The system SHALL manage subcontract-team knowledge-base records as platform-owned operational records for the opening-condition pilot.

#### Scenario: Provider reference is stored as support metadata
- **WHEN** a knowledge-base record includes RAGFlow or mock provider references
- **THEN** the system stores only safe provider identifiers and sync status as support metadata

#### Scenario: Knowledge-base status affects readiness
- **WHEN** a bound knowledge base is draft, needs review, archived, stale, disabled, or unreachable
- **THEN** the readiness summary marks knowledge-base support as missing, provisional, blocked, stale, or unreachable instead of ready

### Requirement: Next-stage delivery prioritization
The system SHALL document that the near-term delivery priority is single-project pilot operability before full multi-tenant permissions, database migration, or provider-specific optimization.

#### Scenario: Planning next work
- **WHEN** maintainers choose the next opening-condition development direction
- **THEN** they can use the project documentation and specs to prioritize operational pilot closure over local optimization
