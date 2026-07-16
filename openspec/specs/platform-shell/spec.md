# platform-shell Specification

## Purpose
TBD - created by archiving change platform-framework-blueprint. Update Purpose after archive.
## Requirements
### Requirement: Role-based login entry
The system SHALL provide a login entry that routes users into the platform according to their role.

#### Scenario: User logs in
- **WHEN** a user logs in with valid credentials
- **THEN** the system loads the platform shell with menus and capabilities permitted for the user's role

#### Scenario: User sees role-specific access
- **WHEN** a user logs in as super admin, supervisor, or contractor
- **THEN** the platform restricts visible pages and modes according to the role

### Requirement: Document library default page
The system SHALL open the document library by default after login.

#### Scenario: User enters platform
- **WHEN** the authenticated user enters the platform
- **THEN** the document library tab is selected by default

#### Scenario: User returns from detail
- **WHEN** the user navigates back from a document detail page
- **THEN** the document library remains the default landing page inside the shell

### Requirement: Main navigation
The system SHALL provide navigation entries for document library, knowledge base, and data assets.

#### Scenario: User views navigation
- **WHEN** the platform shell is rendered
- **THEN** the user can access document library, knowledge base placeholder, and data assets according to permissions

#### Scenario: User sees knowledge base placeholder
- **WHEN** the knowledge base page is selected
- **THEN** the system shows a placeholder page if the capability is not yet implemented

### Requirement: Persistent user controls
The system SHALL keep the current user's identity, role, theme switch, and logout action visible whenever the platform shell is displayed.

#### Scenario: Shell is rendered
- **WHEN** a logged-in user opens any shell-backed page
- **THEN** the system shows the user's identity, role, theme switch, and logout action without requiring navigation into another menu

### Requirement: Light enterprise shell presentation
The system SHALL present the platform shell in a light, enterprise-oriented visual style by default.

#### Scenario: Shell loads
- **WHEN** the platform shell loads
- **THEN** the primary navigation and content surfaces use light backgrounds, clear text contrast, and restrained borders

#### Scenario: Theme changes
- **WHEN** the user switches between supported themes
- **THEN** the shell updates the shared presentation tokens without changing navigation structure

### Requirement: Full-screen document detail entry
The system SHALL open document detail as a dedicated full-screen work area with a back action instead of rendering it as a nested right-side panel inside the library shell.

#### Scenario: User opens a document
- **WHEN** the user enters a document from the library
- **THEN** the system shows the document detail work area as the primary page content

#### Scenario: User returns to the library
- **WHEN** the user clicks the back action from document detail
- **THEN** the system returns to the document library view

### Requirement: Unified semantic theme tokens
The system SHALL render the shell using shared semantic tokens for backgrounds, borders, text, and state colors across light and dark themes.

#### Scenario: User switches theme
- **WHEN** the user toggles between light and dark theme
- **THEN** the shell updates the shared tokens without leaving hardcoded white panels or unreadable dark text behind

### Requirement: Viewport-bounded platform shell
The platform shell SHALL keep the sidebar bounded to the viewport height while the main content scrolls independently.

#### Scenario: Main content exceeds viewport height
- **WHEN** the document library or another shell page is taller than the viewport
- **THEN** the sidebar remains viewport-height and the main content area scrolls inside its own container

#### Scenario: Sidebar content exceeds viewport height
- **WHEN** sidebar navigation and user controls exceed available sidebar height
- **THEN** the sidebar can scroll internally without being stretched by the main content

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

