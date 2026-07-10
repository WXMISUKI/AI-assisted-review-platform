## ADDED Requirements

### Requirement: Completed document result entry
The document library SHALL show a result entry for documents that have completed result assets.

#### Scenario: Completed document is listed
- **WHEN** a document has a generated result asset
- **THEN** the document library shows a view-result action instead of only review actions

### Requirement: Result asset metadata
The document review task SHALL store mock result metadata with the document.

#### Scenario: Result is generated
- **WHEN** the review workbench completion payload is accepted
- **THEN** the document record stores result type, created time, mode, and issue statistics
