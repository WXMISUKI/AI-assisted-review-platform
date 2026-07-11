## ADDED Requirements

### Requirement: Staged file before document creation
The document library SHALL stage a selected or dropped file in the upload card before creating a document task.

#### Scenario: File is selected
- **WHEN** the user selects a file
- **THEN** the file is shown in the upload card as pending addition and is not added to history or the document table yet

#### Scenario: Staged file is removed
- **WHEN** the user removes the staged file
- **THEN** the upload card clears the staged file without creating a document task

#### Scenario: User confirms staged file
- **WHEN** the user clicks the add-document action while a file is staged
- **THEN** the system uploads the staged file, submits OCR, and creates the document task after the add action

#### Scenario: User creates a demo task
- **WHEN** the user clicks the add-document action without a staged file
- **THEN** the system creates a demo document task using the optional metadata fields

### Requirement: Document task deletion
The document library SHALL allow users to delete an existing document task after confirmation.

#### Scenario: User requests document deletion
- **WHEN** the user clicks delete on a document task
- **THEN** the system shows a confirmation dialog identifying the document

#### Scenario: User confirms document deletion
- **WHEN** the user confirms deletion
- **THEN** the system removes the document task from the library state and mock persistence

#### Scenario: User cancels document deletion
- **WHEN** the user cancels deletion
- **THEN** the document task remains unchanged
