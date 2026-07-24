## ADDED Requirements

### Requirement: Source-of-truth ownership
The platform SHALL assign durable state to a domain/service owner and SHALL prevent page components from becoming the authoritative store for cross-page task state.

#### Scenario: Durable review state
- **WHEN** a task, run, human decision, report asset, or archive state changes
- **THEN** the mutation SHALL pass through the owning domain/service contract
- **AND** the page SHALL refresh or consume the returned snapshot

#### Scenario: Transient view state
- **WHEN** a page manages tabs, dialogs, selected rows, or loading indicators
- **THEN** that state MAY remain local to the page
- **AND** it SHALL NOT be used as the durable source for another product or route

### Requirement: Feature module ownership
The repository SHALL keep shared platform modules, construction-plan modules, and opening-condition modules in separable ownership areas.

#### Scenario: New shared code
- **WHEN** code is proposed for `src/shared` or an equivalent shared module
- **THEN** it SHALL be used by both product portals with the same semantics
- **AND** product-specific vocabulary SHALL remain outside the shared module

### Requirement: Governance verification
The repository SHALL provide a lightweight verification command that detects accidental ownership violations and confirms the existing type/smoke baseline.

#### Scenario: Governance check
- **WHEN** the governance verification command runs
- **THEN** it SHALL pass typecheck
- **AND** it SHALL validate portal boundary markers or ownership rules
- **AND** it SHALL leave no temporary verification artifacts in the repository

