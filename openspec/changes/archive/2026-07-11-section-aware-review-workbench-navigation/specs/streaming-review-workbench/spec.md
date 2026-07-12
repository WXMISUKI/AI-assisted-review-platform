## ADDED Requirements

### Requirement: Section-aware loading summary
The streaming review workbench SHALL present the current section as part of the locked loading context.

#### Scenario: Recovered structure is available during loading
- **WHEN** a task has recovered sections and paragraphs before unlock
- **THEN** the loading view can show the current section, section count, and paragraph count alongside the pipeline progress

#### Scenario: Section is not yet known
- **WHEN** the pipeline has not yet recovered a current section
- **THEN** the loading view can fall back to the existing stage label and paragraph label
