## MODIFIED Requirements

### Requirement: Checklist extraction follows the uploaded checklist content
The platform SHALL prefer checklist items extracted from the uploaded checklist document over static built-in templates.

#### Scenario: Uploaded checklist can be parsed
- **WHEN** the uploaded checklist document contains table rows for `资料核查`
- **THEN** the platform extracts checklist items from those rows
- **AND** it persists item id, category, sub-category, content, mandatory flag, as-needed flag, expected material names, and row index as platform facts

#### Scenario: Uploaded checklist contains现场核查 rows
- **WHEN** a parsed checklist row belongs to `现场核查`
- **THEN** the platform excludes that row from the current MVP material-review checklist
- **AND** it does not create a pending material-review item for that row

#### Scenario: Uploaded checklist cannot be parsed
- **WHEN** request-level items and document extraction do not produce items
- **THEN** the platform MAY use a known template fallback if the checklist filename is recognized
- **AND** otherwise records `manual_definition_required`

### Requirement: Agent run pauses only for human review
The platform SHALL run automatic workflow stages until human review is required, then wait for explicit operator input before final report generation.

#### Scenario: Automatic stages complete
- **WHEN** the task has uploaded files and extracted checklist items
- **THEN** the platform records extraction, inventory, matching, and review-readiness events without requiring intermediate operator clicks

#### Scenario: Human review is required
- **WHEN** matching produces open or deferred human-review items
- **THEN** the task remains `awaiting_human_review`
- **AND** final report generation waits for the operator to complete human review
