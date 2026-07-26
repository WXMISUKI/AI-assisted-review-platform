## MODIFIED Requirements

### Requirement: Local fallback remains visible
The document library SHALL keep local fallback tasks available when backend persistence is empty or unavailable.

#### Scenario: Backend is empty
- **WHEN** backend task persistence returns an empty list and the frontend already has locally loaded tasks
- **THEN** the document library keeps the current task list instead of replacing it with an empty state

#### Scenario: Backend is unavailable
- **WHEN** backend persistence cannot be reached
- **THEN** the document library and workbench continue using existing localStorage or seeded behavior
