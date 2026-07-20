## MODIFIED Requirements

### Requirement: Role-based login entry
The system SHALL provide a login entry branded as "AI资料审查平台" that routes users into the authenticated product launcher according to their role.

#### Scenario: User logs in
- **WHEN** a user logs in with valid credentials
- **THEN** the system loads the business selection portal with product entries permitted for the user's role

#### Scenario: User sees role-specific access
- **WHEN** a user logs in as super admin, supervisor, or contractor
- **THEN** the platform restricts visible product entries, pages, and modes according to the role

### Requirement: Document library default page
The system SHALL open the document library by default after the user selects the construction-plan review product.

#### Scenario: User enters construction-plan review
- **WHEN** the authenticated user selects construction-plan review from the product launcher
- **THEN** the construction-plan workspace opens with the document library tab selected by default

#### Scenario: User returns from detail
- **WHEN** the user navigates back from a document detail page
- **THEN** the document library remains the default landing page inside the construction-plan shell

### Requirement: Opening condition review entry
The platform SHALL expose opening-condition review through the authenticated product launcher and an independent opening-condition workspace, rather than as a direct menu item or mixed page inside the construction-plan review shell.

#### Scenario: User navigates to opening-condition review
- **WHEN** an authenticated user selects opening-condition review from the product launcher or an authorized direct product URL
- **THEN** the system opens the opening-condition workspace with its own route namespace, sidebar, context selection, material intake, basis/master-data, check task, human review, and report pages

#### Scenario: Construction-plan shell is displayed
- **WHEN** the construction-plan review shell is rendered
- **THEN** it preserves construction-plan document library, knowledge base, data assets, review workbench, and report entries without embedding opening-condition review as a construction-plan menu item

