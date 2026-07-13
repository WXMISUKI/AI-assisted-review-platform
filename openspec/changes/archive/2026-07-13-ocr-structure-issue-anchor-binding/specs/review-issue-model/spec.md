## MODIFIED Requirements

### Requirement: Stable document anchor
The system SHALL anchor each review issue to a stable document location using paragraph identity, character offsets, and the original anchor text.

#### Scenario: UI renders a highlighted range
- **WHEN** a review issue contains a paragraph anchor and character offsets
- **THEN** the UI can render the exact anchored text range inside the matching paragraph

#### Scenario: Anchor is rebound after OCR hydration
- **WHEN** the task uses a hydrated recovered structure
- **THEN** the system can rebind the issue to a recovered paragraph while preserving the original anchor text as the match source

### Requirement: Manual issue creation contract
The system SHALL create manual review issues using the same structured issue contract as AI-generated review issues.

#### Scenario: Manual issue is created from selected text
- **WHEN** a user submits a manual annotation for selected text
- **THEN** the created issue has `source` set to `manual`, `status` set to `pending`, and an anchor with paragraph identity, offsets, and selected text
