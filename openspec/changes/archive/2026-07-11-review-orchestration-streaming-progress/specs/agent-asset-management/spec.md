## ADDED Requirements

### Requirement: Expanded agent inventory
The system SHALL expose separate agent inventory entries for structure restoration, construction plan review, and review report generation under data assets.

#### Scenario: Admin opens agent assets
- **WHEN** an authorized user opens data assets
- **THEN** the system shows distinct agent entries for structure restoration, construction plan review, and review report generation

### Requirement: Agent prompt binding surface
The system SHALL allow each agent inventory entry to display or bind its dedicated prompt asset and schema version.

#### Scenario: Admin configures an agent
- **WHEN** an authorized user opens an agent entry
- **THEN** the system can show the selected prompt asset, schema version, and placeholder binding status for knowledge sources

### Requirement: Prompt asset registry visibility
The system SHALL keep prompt assets visible as first-class data assets alongside the agent inventory.

#### Scenario: Prompt assets page is opened
- **WHEN** the prompt asset page is displayed
- **THEN** the system shows a prompt registry surface that can later support CRUD without changing the agent inventory layout
