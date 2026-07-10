## MODIFIED Requirements

### Requirement: Document upload and task creation
The system SHALL allow users to upload documents into the document library by drag-and-drop or file picker and create a review task entry linked to the stored source object when a file is selected.

#### Scenario: User uploads document
- **WHEN** the user uploads a supported document file
- **THEN** the system stores the file through the backend object-storage endpoint, creates a document record with source object metadata, and allows the user to start review

#### Scenario: User drops a file
- **WHEN** the user drags a file into the upload area
- **THEN** the system uploads the file to object storage before creating the corresponding review task entry

#### Scenario: User selects a file
- **WHEN** the user clicks to choose a file from the upload control
- **THEN** the system uploads the selected file to object storage before creating the same document record flow as drag-and-drop upload

#### Scenario: User provides optional metadata
- **WHEN** the user leaves the file name or project name empty
- **THEN** the system uses the uploaded file name and a default project label instead of blocking upload

#### Scenario: Object upload fails
- **WHEN** the backend object-storage upload returns a failed result
- **THEN** the system shows the upload failure and does not create a document task for that file

#### Scenario: User creates a mock task without selecting a file
- **WHEN** the user clicks the manual upload action without selecting a file
- **THEN** the system may create a mock review task without source object metadata for prototype testing
