## MODIFIED Requirements

### Requirement: Unified product launcher
The system SHALL provide one authenticated business selection portal that routes authorized users into independent product workspaces.

#### Scenario: User enters after login
- **WHEN** an authenticated user has access to more than one product portal
- **THEN** the system shows a product launcher with separate entries for construction-plan review and opening-condition review

#### Scenario: User has one product
- **WHEN** an authenticated user has access to exactly one product portal
- **THEN** the system may route directly into that product while preserving a way to return to the product launcher when authorized

### Requirement: Product-specific navigation
Each product portal SHALL expose only navigation that belongs to that product's business workflow.

#### Scenario: Construction-plan sidebar renders
- **WHEN** the construction-plan portal sidebar is shown
- **THEN** it does not show opening-condition review as a construction-plan document-library menu item

#### Scenario: Opening-condition sidebar renders
- **WHEN** the opening-condition portal sidebar is shown
- **THEN** it shows opening-condition workflow pages for workspace overview, material intake, basis and master data, check tasks, human review, and reports

#### Scenario: Operational pilot controls render
- **WHEN** opening-condition pilot intake or provider readiness controls are rendered
- **THEN** they appear inside the opening-condition workspace page that owns that workflow step and not on the shared product launcher

