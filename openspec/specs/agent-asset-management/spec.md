# agent-asset-management Specification

## Purpose
TBD - created by archiving change platform-framework-blueprint. Update Purpose after archive.
## Requirements
### Requirement: Agent asset navigation
The system SHALL expose an agent management entry under data assets for authorized users.

#### Scenario: Admin views data assets
- **WHEN** an authorized admin opens data assets
- **THEN** the system displays agent management and prompt asset entries

#### Scenario: User opens data assets from shell
- **WHEN** the user clicks the data assets entry in the platform shell
- **THEN** the system shows the agent and prompt asset navigation options

### Requirement: Agent prompt binding
The system SHALL allow agents to be associated with dedicated prompt assets.

#### Scenario: Admin configures agent
- **WHEN** an admin edits an agent configuration
- **THEN** the admin can select or update the prompt asset used by that agent

#### Scenario: Admin sees prompt assets
- **WHEN** the prompt asset page is opened
- **THEN** the admin can view prompt assets and their binding status

### Requirement: Initial agent inventory
The system SHALL reserve entries for a construction plan review agent and a review report generation agent.

#### Scenario: Agent list is shown
- **WHEN** the agent management page is opened
- **THEN** the construction plan review agent and review report generation agent are visible as configurable assets

#### Scenario: Prompt assets page opens
- **WHEN** the prompt assets page is opened
- **THEN** the system shows placeholder content if CRUD is not yet implemented

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

### Requirement: Agent connectivity panel
The data assets page SHALL expose a safe backend connectivity panel for configured agent resources.

#### Scenario: User opens data assets
- **WHEN** the data assets page is displayed
- **THEN** it shows backend, LLM, OCR, and streaming readiness status without revealing secrets

#### Scenario: User runs connectivity checks
- **WHEN** the user triggers backend connectivity checks
- **THEN** the page displays success or safe failure summaries for health, LLM, OCR, and streaming endpoints

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

### Requirement: Opening condition agent asset visibility
The agent asset catalog SHALL show the opening-condition review agent/workflow bridge as a distinct asset.

#### Scenario: Data assets are displayed
- **WHEN** the data assets page lists agent capabilities
- **THEN** it includes an opening-condition review asset describing Dify workflow orchestration, Human Input review points, master-data comparison, and report generation responsibilities

### Requirement: Dify bridge boundary
The agent asset catalog SHALL distinguish Dify workflow responsibilities from platform-owned records.

#### Scenario: Opening condition bridge is inspected
- **WHEN** a user reads the opening-condition agent asset details
- **THEN** the system identifies Dify as responsible for workflow orchestration, OCR/LLM extraction, Human Input, and report drafting while platform records own basis versions, master data, check outcomes, evidence, and audit state

### Requirement: Opening-condition specialized agent inventory
The agent asset catalog SHALL expose specialized opening-condition intelligent assets instead of only one broad review entry.

#### Scenario: Data assets page lists opening-condition assets
- **WHEN** the user opens agent assets
- **THEN** the catalog includes separate entries for issue-type review, rectification/regulation guidance, and original-form backfill or export adapters

### Requirement: Opening-condition asset binding metadata
The asset catalog SHALL show how opening-condition assets bind to prompts, templates, schemas, and issue taxonomy hooks.

#### Scenario: Operator inspects an opening-condition asset
- **WHEN** a specialized opening-condition asset entry is displayed
- **THEN** the page shows its prompt asset, template or adapter binding, schema version, and current readiness or placeholder status
