## MODIFIED Requirements

### Requirement: Opening condition review entry
The platform SHALL expose opening-condition review through the authenticated product launcher and an independent opening-condition portal, rather than as a direct menu item inside the construction-plan review shell.

#### Scenario: User navigates to opening-condition review
- **WHEN** an authenticated user selects opening-condition review from the product launcher or an authorized direct product URL
- **THEN** the system opens the opening-condition portal with its own route namespace, sidebar, context selection, and workflow pages

#### Scenario: Construction-plan shell is displayed
- **WHEN** the construction-plan review shell is rendered
- **THEN** it preserves construction-plan document library, knowledge base, data assets, review workbench, and report entries without embedding opening-condition review as a construction-plan menu item

### Requirement: Opening condition review role framing
The platform SHALL frame opening-condition review inside its own product portal for construction-unit self-check and supervisor assisted review.

#### Scenario: Role context is visible
- **WHEN** a user views the opening-condition review portal
- **THEN** the page explains the role-compatible workflow as internal auxiliary review rather than administrative approval
