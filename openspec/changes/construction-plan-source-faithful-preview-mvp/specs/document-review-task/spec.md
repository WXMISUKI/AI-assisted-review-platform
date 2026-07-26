## ADDED Requirements

### Requirement: Workbench source-object handoff
The document review task SHALL make stored source-object metadata available to the review workbench for source-faithful preview.

#### Scenario: Ready task has source object
- **WHEN** a ready review task includes stored source-object metadata
- **THEN** the workbench entry can receive that source metadata together with the review session context

#### Scenario: Demo task has no source object
- **WHEN** a mock or legacy task has no stored source object
- **THEN** the workbench entry continues to open without source-faithful preview data
