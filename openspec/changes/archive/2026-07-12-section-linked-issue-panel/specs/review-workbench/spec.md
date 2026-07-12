## ADDED Requirements

### Requirement: Section-linked issue grouping
The review workbench SHALL group issues in the side panel by their document section when section information is available.

#### Scenario: Issues belong to sections
- **WHEN** the workbench has recovered sections or paragraph section labels
- **THEN** the issue panel can display section headers with the issue cards belonging to each section

#### Scenario: Section data is unavailable
- **WHEN** the workbench cannot determine section boundaries
- **THEN** the issue panel can fall back to the existing flat list without blocking review actions

### Requirement: Current section synchronization
The review workbench SHALL keep the active section synchronized between outline navigation, document focus, and issue panel context.

#### Scenario: User clicks a section
- **WHEN** the user selects a section in the outline
- **THEN** the workbench updates the active section context and keeps the matching issue group visually emphasized

#### Scenario: User focuses an issue
- **WHEN** the user clicks an issue card or highlighted text
- **THEN** the workbench can promote that issue's section to the active section context
