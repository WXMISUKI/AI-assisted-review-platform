## ADDED Requirements

### Requirement: Viewport-bounded platform shell
The platform shell SHALL keep the sidebar bounded to the viewport height while the main content scrolls independently.

#### Scenario: Main content exceeds viewport height
- **WHEN** the document library or another shell page is taller than the viewport
- **THEN** the sidebar remains viewport-height and the main content area scrolls inside its own container

#### Scenario: Sidebar content exceeds viewport height
- **WHEN** sidebar navigation and user controls exceed available sidebar height
- **THEN** the sidebar can scroll internally without being stretched by the main content
