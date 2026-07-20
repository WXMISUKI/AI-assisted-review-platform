## MODIFIED Requirements

### Requirement: Document library default page
The system SHALL open the construction-plan document library by default after the user selects the construction-plan review product.

#### Scenario: User enters construction-plan review
- **WHEN** the authenticated user selects construction-plan review from the product launcher
- **THEN** the construction-plan workspace opens with the document library tab selected by default

#### Scenario: User returns from detail
- **WHEN** the user navigates back from a construction-plan document detail or review workbench page
- **THEN** the system returns to the construction-plan workspace with the document library available through the sidebar

### Requirement: Main navigation
The system SHALL provide construction-plan workspace navigation entries for document library, knowledge base, data assets, and review workbench entry.

#### Scenario: User views construction-plan navigation
- **WHEN** the construction-plan workspace shell is rendered
- **THEN** the user can access document library, knowledge base, data assets, and review workbench according to permissions

#### Scenario: User enters review workbench
- **WHEN** the user opens or starts a review task from the construction-plan workspace
- **THEN** the review workbench is shown as the right-side product content or focused detail surface without replacing the product launcher

