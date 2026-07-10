## MODIFIED Requirements

### Requirement: Persistent user controls
The system SHALL keep the current user's identity, role, theme switch, and logout action visible whenever the platform shell is displayed.

#### Scenario: Shell is rendered
- **WHEN** a logged-in user opens any shell-backed page
- **THEN** the system shows the user's identity, role, theme switch, and logout action without requiring navigation into another menu

### Requirement: Full-screen document detail entry
The system SHALL open document detail as a dedicated full-screen work area with a back action instead of rendering it as a nested right-side panel inside the library shell.

#### Scenario: User opens a document
- **WHEN** the user enters a document from the library
- **THEN** the system shows the document detail work area as the primary page content

#### Scenario: User returns to the library
- **WHEN** the user clicks the back action from document detail
- **THEN** the system returns to the document library view

## ADDED Requirements

### Requirement: Unified semantic theme tokens
The system SHALL render the shell using shared semantic tokens for backgrounds, borders, text, and state colors across light and dark themes.

#### Scenario: User switches theme
- **WHEN** the user toggles between light and dark theme
- **THEN** the shell updates the shared tokens without leaving hardcoded white panels or unreadable dark text behind
