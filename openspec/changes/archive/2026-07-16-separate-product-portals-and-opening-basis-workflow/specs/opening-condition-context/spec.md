## ADDED Requirements

### Requirement: Opening-condition workspace context
The opening-condition portal SHALL require a selected workspace context before users upload basis files, publish master data, or start formal check tasks.

#### Scenario: No workspace selected
- **WHEN** a user enters an opening-condition workflow page without an active workspace
- **THEN** the system prompts the user to select or create a workspace context before proceeding

#### Scenario: Workspace selected
- **WHEN** a user selects a workspace
- **THEN** the portal displays project, contract package, participating organization, and review purpose context for subsequent pages

### Requirement: Project and contract-package binding
An opening-condition workspace SHALL be bound to a project and contract package or section.

#### Scenario: Workspace is created
- **WHEN** a user creates an opening-condition workspace
- **THEN** the user must bind it to a project and contract package or section before review tasks can be created

#### Scenario: Review task is created
- **WHEN** a review task is created inside a workspace
- **THEN** the task inherits the workspace project and contract-package identifiers

### Requirement: Participating organization distinction
The opening-condition portal SHALL distinguish participating organizations and their role in the project.

#### Scenario: Organization is added
- **WHEN** a participating organization is added to a workspace
- **THEN** the system records its organization name, role type, and relationship to the selected project or contract package

#### Scenario: Organization-scoped upload occurs
- **WHEN** a user uploads materials for a participating organization
- **THEN** the uploaded materials are associated with that organization and workspace

### Requirement: Workspace role framing
The opening-condition portal SHALL frame actions according to the user's role in the selected workspace.

#### Scenario: Construction-unit user opens workspace
- **WHEN** a construction-unit user opens a workspace
- **THEN** the portal frames actions as self-check and preparation before human responsibility confirmation

#### Scenario: Supervisor user opens workspace
- **WHEN** a supervisor user opens a workspace
- **THEN** the portal frames actions as assisted review and human adjudication

### Requirement: Context-safe task isolation
The opening-condition portal SHALL isolate review data by workspace context.

#### Scenario: User changes workspace
- **WHEN** a user switches from one workspace to another
- **THEN** basis sets, master data, check tasks, evidence, and reports are loaded for the selected workspace only
