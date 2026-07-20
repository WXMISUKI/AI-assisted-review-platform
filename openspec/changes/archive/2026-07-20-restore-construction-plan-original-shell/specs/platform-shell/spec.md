## MODIFIED Requirements

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
