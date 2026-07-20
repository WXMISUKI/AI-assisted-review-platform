## MODIFIED Requirements

### Requirement: Independent product route namespaces
Each product portal SHALL own an independent route namespace so business pages, task state, and navigation do not depend on another product shell.

#### Scenario: Construction-plan portal opens
- **WHEN** a user enters the construction-plan review product
- **THEN** the active route namespace and sidebar are scoped to construction-plan review and default to its document library

#### Scenario: Opening-condition portal opens
- **WHEN** a user enters the opening-condition review product
- **THEN** the active route namespace and sidebar are scoped to opening-condition review

### Requirement: Product-specific navigation
Each product portal SHALL expose only navigation that belongs to that product's business workflow.

#### Scenario: Construction-plan sidebar renders
- **WHEN** the construction-plan portal sidebar is shown
- **THEN** it shows construction-plan document library, knowledge base, data assets, and review task entry without opening-condition workflow pages

#### Scenario: Opening-condition sidebar renders
- **WHEN** the opening-condition portal sidebar is shown
- **THEN** it shows opening-condition workflow pages for workspace overview, material intake, basis and master data, check tasks, human review, and reports

#### Scenario: Operational pilot controls render
- **WHEN** opening-condition pilot intake or provider readiness controls are rendered
- **THEN** they appear inside the opening-condition workspace page that owns that workflow step and not inside construction-plan navigation

