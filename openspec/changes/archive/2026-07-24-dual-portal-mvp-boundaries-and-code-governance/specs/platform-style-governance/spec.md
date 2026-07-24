## MODIFIED Requirements

### Requirement: Layered stylesheet entry
The platform SHALL keep one stylesheet entry while separating semantic tokens, shared shell/component rules, and product feature styles.

#### Scenario: Root styles are loaded
- **WHEN** the application bootstraps its global stylesheet entry
- **THEN** theme tokens and shared base rules SHALL load through the root entry
- **AND** feature-specific styles SHALL load from dedicated product stylesheet files

### Requirement: Feature stylesheet extraction
The system SHALL allow business-domain styles to live outside the monolithic root stylesheet and SHALL prohibit new product-specific selectors from being added to the monolithic block.

#### Scenario: Opening-condition workspace styles are maintained
- **WHEN** the opening-condition workspace needs visual updates
- **THEN** its domain styles SHALL be changed inside a dedicated feature stylesheet
- **AND** root tokens and unrelated product styles SHALL not need to be edited in the same block

#### Scenario: Construction-plan workspace styles are maintained
- **WHEN** the construction-plan workspace needs visual updates
- **THEN** its domain styles SHALL be changed inside a dedicated construction-plan stylesheet
- **AND** it SHALL reuse semantic tokens instead of hard-coded status colors

