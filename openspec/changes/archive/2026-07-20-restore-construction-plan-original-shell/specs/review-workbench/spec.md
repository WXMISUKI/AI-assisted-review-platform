## ADDED Requirements

### Requirement: Clean construction-plan review copy
The review workbench SHALL render readable UTF-8 Chinese copy for construction-plan review labels, actions, issue cards, dialogs, and status text.

#### Scenario: User opens the construction-plan review workbench
- **WHEN** a user enters the review workbench from the construction-plan document flow
- **THEN** major labels, buttons, headings, dialog text, issue metadata, and status filters are readable Chinese rather than mojibake strings

#### Scenario: User performs issue handling
- **WHEN** a user accepts, rejects, edits, creates, or deletes a review issue
- **THEN** the action labels and confirmation dialog copy remain readable and aligned with construction-plan review semantics

### Requirement: Workbench remains task-scoped
The review workbench SHALL remain a focused task/detail surface entered from construction-plan document flow rather than the default product landing page.

#### Scenario: Product opens
- **WHEN** the user selects the construction-plan review product
- **THEN** the review workbench is not shown until a document task is opened or started

#### Scenario: Workbench opens
- **WHEN** the user opens a document task
- **THEN** the workbench receives the selected document, role-based modes, recovered structure, issues, and task callbacks from the construction-plan product component
