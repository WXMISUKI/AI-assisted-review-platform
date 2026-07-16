## ADDED Requirements

### Requirement: Unified product launcher
The system SHALL provide one authenticated entry that routes authorized users into independent business product portals.

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
- **THEN** the active route namespace and sidebar are scoped to construction-plan review

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
- **THEN** it does not show opening-condition review as a construction-plan document-library menu item

#### Scenario: Opening-condition sidebar renders
- **WHEN** the opening-condition portal sidebar is shown
- **THEN** it shows opening-condition workflow pages such as workspace context, basis sets, master data, check tasks, review queue, and reports

### Requirement: Product access framing
The system SHALL distinguish product access from shared account identity.

#### Scenario: User lacks product permission
- **WHEN** a user without permission requests a product portal
- **THEN** the system shows a safe access-denied state without exposing product task data

#### Scenario: User switches product
- **WHEN** a user switches from one authorized product to another
- **THEN** the system resets product-specific context while keeping the same account identity
