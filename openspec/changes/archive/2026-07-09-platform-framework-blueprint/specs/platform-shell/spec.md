## ADDED Requirements

### Requirement: Role-based login entry
The system SHALL provide a login entry that routes users into the platform according to their role.

#### Scenario: User logs in
- **WHEN** a user logs in with valid credentials
- **THEN** the system loads the platform shell with menus and capabilities permitted for the user's role

### Requirement: Document library default page
The system SHALL open the document library by default after login.

#### Scenario: User enters platform
- **WHEN** the authenticated user enters the platform
- **THEN** the document library tab is selected by default

### Requirement: Main navigation
The system SHALL provide navigation entries for document library, knowledge base, and data assets.

#### Scenario: User views navigation
- **WHEN** the platform shell is rendered
- **THEN** the user can access document library, knowledge base placeholder, and data assets according to permissions
