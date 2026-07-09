## MODIFIED Requirements

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
