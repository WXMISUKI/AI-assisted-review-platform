## MODIFIED Requirements

### Requirement: Independent product route namespaces
Each product portal SHALL own an independent route namespace, state namespace, navigation model, and acceptance entry point so business pages and task state do not depend on another product shell.

#### Scenario: Construction-plan portal opens
- **WHEN** a user enters the construction-plan review product
- **THEN** the active route namespace, navigation, task state, and acceptance fixtures SHALL be scoped to construction-plan review
- **AND** opening-condition workflow pages and state SHALL not be initialized as a prerequisite

#### Scenario: Opening-condition portal opens
- **WHEN** a user enters the opening-condition review product
- **THEN** the active route namespace, navigation, task state, and acceptance fixtures SHALL be scoped to opening-condition review
- **AND** construction-plan review task state SHALL not be initialized as a prerequisite

### Requirement: Shared platform services
Product portals SHALL reuse shared platform services through explicit service boundaries rather than copying OCR, object storage, provider diagnostics, report/export handoff, or agent-gateway logic.

#### Scenario: Portal uploads a document
- **WHEN** either product portal uploads a supported document
- **THEN** the upload SHALL use the shared object-storage service boundary
- **AND** product-specific metadata SHALL be recorded separately

#### Scenario: Portal uses OCR
- **WHEN** either product portal submits a file for OCR
- **THEN** OCR status and safe diagnostics SHALL be provided through the shared provider-summary contract

#### Scenario: Portal uses shared service
- **WHEN** either product invokes object storage, OCR, provider readiness, or document conversion
- **THEN** the call SHALL use the shared adapter contract
- **AND** the product SHALL store only its own task-specific references and decisions

### Requirement: Product-specific navigation
Each product portal SHALL expose only navigation that belongs to its product's MVP workflow.

#### Scenario: Construction-plan sidebar renders
- **WHEN** the construction-plan portal sidebar is shown
- **THEN** it SHALL show construction-plan document library, knowledge base, data assets, and review task flow without opening-condition workflow pages

#### Scenario: Opening-condition sidebar renders
- **WHEN** the opening-condition portal sidebar is shown
- **THEN** it SHALL show opening-condition workflow pages for workspace overview, material intake, basis and master data, check tasks, human review, and reports

#### Scenario: Operational pilot controls render
- **WHEN** opening-condition pilot intake or provider readiness controls are rendered
- **THEN** they SHALL appear inside the opening-condition workspace page that owns that workflow step and not inside construction-plan navigation

#### Scenario: Construction-plan navigation
- **WHEN** the construction-plan sidebar renders
- **THEN** it SHALL show document intake, review preparation, issue review, result assets, and relevant shared asset pages
- **AND** it SHALL not show opening-condition basis, master-data, packet, or rerun controls

#### Scenario: Opening-condition navigation
- **WHEN** the opening-condition sidebar renders
- **THEN** it SHALL show workspace, intake, basis/master data, checklist, human review, report, and history controls
- **AND** it SHALL not show construction-plan document issue controls
