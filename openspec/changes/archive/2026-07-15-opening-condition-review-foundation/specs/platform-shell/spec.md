## ADDED Requirements

### Requirement: Opening condition review entry
The platform shell SHALL expose opening-condition review as a first-class business entry without replacing the existing document library or construction plan review workbench.

#### Scenario: User navigates to opening-condition review
- **WHEN** an authenticated user clicks the opening-condition review navigation item
- **THEN** the shell displays the opening-condition review page and preserves the existing document library, knowledge base, and data assets entries

### Requirement: Opening condition review role framing
The platform shell SHALL frame opening-condition review for construction-unit self-check and supervisor assisted review.

#### Scenario: Role context is visible
- **WHEN** a user views the opening-condition review page
- **THEN** the page explains the role-compatible workflow as internal auxiliary review rather than administrative approval
