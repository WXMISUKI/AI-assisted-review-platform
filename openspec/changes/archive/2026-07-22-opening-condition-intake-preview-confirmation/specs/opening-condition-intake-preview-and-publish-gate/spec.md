## MODIFIED Requirements

### Requirement: Current run intake preview gate
The system SHALL present the current pilot run intake as a preview-and-publish gate before formal checklist matching.

#### Scenario: Operator reviews current run intake preview
- **WHEN** the operator opens the material-intake page for a bootstrapped or initialized run
- **THEN** the page shows the current run basis, required master data, knowledge-base binding, preview status, next action, and candidate preview before formal matching

#### Scenario: Preview gate distinguishes basis and master-data readiness
- **WHEN** the current run has unpublished basis or unconfirmed required master data
- **THEN** the page shows which part of the gate is still pending instead of presenting only a generic blocked state
- **AND** it keeps the candidate preview visible so the operator can inspect what is being confirmed
