# platform-shell Specification

## Purpose
TBD - created by archiving change platform-framework-blueprint. Update Purpose after archive.
## Requirements
### Requirement: Role-based login entry
The system SHALL provide a login entry branded as "AI资料审查平台" that routes users into the authenticated product launcher according to their role.

#### Scenario: User logs in
- **WHEN** a user logs in with valid credentials
- **THEN** the system loads the business selection portal with product entries permitted for the user's role

#### Scenario: User sees role-specific access
- **WHEN** a user logs in as super admin, supervisor, or contractor
- **THEN** the platform restricts visible product entries, pages, and modes according to the role

### Requirement: Document library default page
The system SHALL open the construction-plan document library by default after the user selects the construction-plan review product.

#### Scenario: User enters construction-plan review
- **WHEN** the authenticated user selects construction-plan review from the product launcher
- **THEN** the construction-plan workspace opens with the historical document library tab selected by default
- **AND** the workspace preserves the original left navigation and main content structure from commit `9b4fdb378d124a1ae8b603a6dc67bccbf00bfa60`

#### Scenario: User returns from detail
- **WHEN** the user navigates back from a construction-plan document detail, review loading, review workbench, or result page
- **THEN** the system returns to the construction-plan workspace document library rather than the cross-product launcher unless the user explicitly chooses to switch products

### Requirement: Main navigation
The system SHALL provide construction-plan workspace navigation entries for document library, knowledge base, data assets, review loading/detail/result flow, and review workbench entry according to the original construction-plan product model.

#### Scenario: User views construction-plan navigation
- **WHEN** the construction-plan workspace shell is rendered
- **THEN** the user can access document library, knowledge base, data assets, and task-driven review pages according to permissions
- **AND** opening-condition workflow pages are not embedded in the construction-plan sidebar

#### Scenario: User enters review workbench
- **WHEN** the user opens or starts a review task from the construction-plan workspace
- **THEN** the review workbench is shown as a focused construction-plan task surface without replacing the product launcher or mixing opening-condition content

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
The platform SHALL expose opening-condition review through the authenticated product launcher and an independent opening-condition workspace, rather than as a direct menu item or mixed page inside the construction-plan review shell.

#### Scenario: User navigates to opening-condition review
- **WHEN** an authenticated user selects opening-condition review from the product launcher or an authorized direct product URL
- **THEN** the system opens the opening-condition workspace with its own route namespace, sidebar, context selection, material intake, basis/master-data, check task, human review, and report pages

#### Scenario: Construction-plan shell is displayed
- **WHEN** the construction-plan review shell is rendered
- **THEN** it preserves construction-plan document library, knowledge base, data assets, review loading/detail/result, and report entries without embedding opening-condition review as a construction-plan menu item

#### Scenario: User switches products
- **WHEN** the user returns from construction-plan review to the product launcher and opens opening-condition review
- **THEN** construction-plan document/task state does not appear inside opening-condition pages

### Requirement: Opening condition review role framing
The platform SHALL frame opening-condition review inside its own product portal for construction-unit self-check and supervisor assisted review.

#### Scenario: Role context is visible
- **WHEN** a user views the opening-condition review portal
- **THEN** the page explains the role-compatible workflow as internal auxiliary review rather than administrative approval

### Requirement: Construction-plan library visual restoration
The construction-plan document library SHALL render styled enterprise controls and list hierarchy after the historical workspace restoration.

#### Scenario: Upload panel is shown
- **WHEN** the construction-plan document library renders its upload panel
- **THEN** the upload dropzone, native file picker trigger, document name input, project name input, staged file summary, and add-document action use the platform's styled control treatment rather than browser-default controls

#### Scenario: Document list is shown
- **WHEN** construction-plan tasks are listed in the document library
- **THEN** each task row has a visible surface background, border, status chips, lifecycle text, and aligned action buttons

#### Scenario: Theme changes
- **WHEN** the user switches between light and dark themes
- **THEN** document library controls and task rows continue using semantic tokens for surface, border, text, and button colors

### Requirement: Visual change governance
The platform SHALL require explicit discussion and an OpenSpec change before major changes to shared components, platform shell structure, navigation presentation, or mature page visual style.

#### Scenario: Developer proposes a major visual change
- **WHEN** a change would alter shared component classes, app shell layout, product navigation, or the established display style of a mature workflow
- **THEN** the change is captured in OpenSpec and discussed before implementation begins

#### Scenario: Developer applies a minor style fix
- **WHEN** a change only restores missing styling, fixes a visual regression, or aligns existing classes with documented tokens
- **THEN** the change may proceed under a focused restoration spec without redesigning the workflow

