## MODIFIED Requirements

### Requirement: Workbench as document detail page
The review workbench SHALL function as the document detail page entered from the document library and review task flow.

#### Scenario: User opens completed review task
- **WHEN** the user opens a document whose AI review task is ready
- **THEN** the system displays the review workbench with document content and review issues

#### Scenario: User opens workbench from shell
- **WHEN** the user clicks a ready document in the library
- **THEN** the system loads the workbench inside the platform shell without losing shell navigation
