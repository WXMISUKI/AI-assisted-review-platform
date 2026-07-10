## ADDED Requirements

### Requirement: Service-backed document library state
The document review task SHALL load and mutate document library records through the review session service boundary.

#### Scenario: Library loads documents
- **WHEN** the document library is displayed
- **THEN** the document list is read from the review session service rather than page-local seeded arrays

#### Scenario: Library creates document task
- **WHEN** a user uploads, drops, or manually adds a document
- **THEN** the new document task is created through the review session service and becomes visible in the library state

### Requirement: Refresh-resilient mock tasks
The document review task SHALL retain mock document tasks across page refreshes during MVP testing.

#### Scenario: User refreshes document library
- **WHEN** a user refreshes after creating or completing a document task
- **THEN** the document library restores the current task list and task result state from mock persistence
