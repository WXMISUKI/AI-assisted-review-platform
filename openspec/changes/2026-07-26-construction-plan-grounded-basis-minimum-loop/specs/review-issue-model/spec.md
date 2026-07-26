## MODIFIED Requirements

### Requirement: Structured basis references
The system SHALL represent normative and project-specific basis references as structured data rather than only free text.

#### Scenario: Rule or LLM issue is generated from a basis string
- **WHEN** a generated issue only has a raw basis string from rule or LLM output
- **THEN** the system normalizes it into at least one structured basis reference when storing the issue
- **AND** the issue does not depend on the workbench parsing raw basis text on the fly

#### Scenario: Basis text cannot be fully parsed
- **WHEN** a raw basis string cannot be completely resolved into title, version, and clause fields
- **THEN** the system still stores a safe partial structured reference instead of dropping basis traceability
