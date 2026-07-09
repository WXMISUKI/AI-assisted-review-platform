## ADDED Requirements

### Requirement: Manual issue creation contract
The system SHALL create manual review issues using the same structured issue contract as AI-generated review issues.

#### Scenario: Manual issue is created from selected text
- **WHEN** a user submits a manual annotation for selected text
- **THEN** the created issue has `source` set to `manual`, `status` set to `pending`, and an anchor with paragraph identity, offsets, and selected text

### Requirement: Manual issue default fields
The system SHALL provide sensible default values for manual issue fields when the user leaves optional fields empty.

#### Scenario: User submits partial manual annotation
- **WHEN** the user submits selected text with only a title
- **THEN** the system still creates a complete issue with fallback reason, basis, and suggestion text
