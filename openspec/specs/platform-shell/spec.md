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

