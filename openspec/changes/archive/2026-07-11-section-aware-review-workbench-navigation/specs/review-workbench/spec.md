## ADDED Requirements

### Requirement: Section-aware outline navigation
The review workbench SHALL render the document outline from recovered sections when available.

#### Scenario: Recovered sections exist
- **WHEN** the task includes a recovered document structure with sections
- **THEN** the outline panel shows section titles and paragraph counts instead of repeating each paragraph's section label

#### Scenario: No recovered sections exist
- **WHEN** the task does not yet have recovered sections
- **THEN** the outline can fall back to the existing paragraph-based structure without blocking the workbench

### Requirement: Current section visibility
The review workbench SHALL surface the current section and current paragraph location in the detail context.

#### Scenario: Current section is known
- **WHEN** the recovered structure or stream snapshot includes a current section
- **THEN** the workbench displays that section as the active reading location

#### Scenario: Current paragraph is known
- **WHEN** the recovered structure or stream snapshot includes a current paragraph id
- **THEN** the workbench can expose that paragraph as the current processing anchor
