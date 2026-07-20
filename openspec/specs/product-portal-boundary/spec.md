# product-portal-boundary Specification

## Purpose
TBD - created by archiving change separate-product-portals-and-opening-basis-workflow. Update Purpose after archive.
## Requirements
### Requirement: Unified product launcher
The system SHALL provide one authenticated business selection portal that routes authorized users into independent product workspaces.

#### Scenario: User enters after login
- **WHEN** an authenticated user has access to more than one product portal
- **THEN** the system shows a product launcher with separate entries for construction-plan review and opening-condition review

#### Scenario: User has one product
- **WHEN** an authenticated user has access to exactly one product portal
- **THEN** the system may route directly into that product while preserving a way to return to the product launcher when authorized

### Requirement: Independent product route namespaces
Each product portal SHALL own an independent route namespace so business pages, task state, and navigation do not depend on another product shell.

#### Scenario: Construction-plan portal opens
- **WHEN** a user enters the construction-plan review product
- **THEN** the active route namespace and sidebar are scoped to construction-plan review and default to its historical document library flow
- **AND** the construction-plan product reuses the baseline product workspace from commit `9b4fdb378d124a1ae8b603a6dc67bccbf00bfa60` as its display source of truth

#### Scenario: Opening-condition portal opens
- **WHEN** a user enters the opening-condition review product
- **THEN** the active route namespace and sidebar are scoped to opening-condition review

### Requirement: Shared platform services
Product portals SHALL reuse shared platform services through explicit service boundaries rather than copying OCR, object storage, provider diagnostics, or agent-gateway logic.

#### Scenario: Portal uploads a document
- **WHEN** either product portal uploads a supported document
- **THEN** the upload uses the shared object-storage service boundary and records product-specific metadata separately

#### Scenario: Portal uses OCR
- **WHEN** either product portal submits a file for OCR
- **THEN** OCR status and safe diagnostics are provided through shared provider-summary contracts

### Requirement: Product-specific navigation
Each product portal SHALL expose only navigation that belongs to that product's business workflow.

#### Scenario: Construction-plan sidebar renders
- **WHEN** the construction-plan portal sidebar is shown
- **THEN** it shows construction-plan document library, knowledge base, data assets, and review task flow without opening-condition workflow pages

#### Scenario: Opening-condition sidebar renders
- **WHEN** the opening-condition portal sidebar is shown
- **THEN** it shows opening-condition workflow pages for workspace overview, material intake, basis and master data, check tasks, human review, and reports

#### Scenario: Operational pilot controls render
- **WHEN** opening-condition pilot intake or provider readiness controls are rendered
- **THEN** they appear inside the opening-condition workspace page that owns that workflow step and not inside construction-plan navigation

### Requirement: Product access framing
The system SHALL distinguish product access from shared account identity.

#### Scenario: User lacks product permission
- **WHEN** a user without permission requests a product portal
- **THEN** the system shows a safe access-denied state without exposing product task data

#### Scenario: User switches product
- **WHEN** a user switches from one authorized product to another
- **THEN** the system resets product-specific context while keeping the same account identity

