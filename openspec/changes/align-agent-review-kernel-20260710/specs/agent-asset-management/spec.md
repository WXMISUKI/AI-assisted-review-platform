## ADDED Requirements

### Requirement: Construction review agent kernel profile
The system SHALL allow the construction plan review agent asset to expose a kernel profile aligned with the专项施工方案审查 domain.

#### Scenario: Admin views review agent configuration
- **WHEN** an authorized admin opens the construction plan review agent asset
- **THEN** the page shows the agent's kernel profile including supported basis categories, check domains, engine types, output scenarios, and output schema version

### Requirement: Review agent knowledge entry points
The system SHALL reserve configurable knowledge entry points for normative sources and project-specific documents.

#### Scenario: Admin views knowledge bindings
- **WHEN** the construction plan review agent configuration is displayed
- **THEN** the system shows placeholders for normative knowledge, project tender/bid/contract documents, design drawings,施工组织设计, and safety risk assessment report bindings

### Requirement: Review agent prompt and schema binding
The system SHALL bind the construction plan review agent to a prompt asset and a structured output schema.

#### Scenario: Prompt asset is selected
- **WHEN** an admin configures the construction plan review agent
- **THEN** the admin can see which prompt asset and issue-output schema version will be used by the agent
