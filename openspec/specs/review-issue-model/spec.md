# review-issue-model Specification

## Purpose
TBD - created by archiving change interactive-review-mvp. Update Purpose after archive.
## Requirements
### Requirement: Structured review issue
The system SHALL represent each AI or manual finding as a structured review issue with identity, source, severity, status, anchor, finding details, and resolution data.

#### Scenario: AI returns a review issue
- **WHEN** the application receives an AI finding
- **THEN** the finding can be represented as a review issue object without parsing free-form text

### Requirement: Stable document anchor
The system SHALL anchor each review issue to a stable document location using paragraph identity, character offsets, and the original anchor text.

#### Scenario: UI renders a highlighted range
- **WHEN** a review issue contains a paragraph anchor and character offsets
- **THEN** the UI can render the exact anchored text range inside the matching paragraph

### Requirement: Finding explanation fields
The system SHALL store the issue title, reason, basis, risk level, and suggested replacement separately.

#### Scenario: User views an issue card
- **WHEN** an issue card is displayed
- **THEN** the user can distinguish the problem summary, non-compliance reason, normative basis, severity, and AI suggestion

### Requirement: Human resolution data
The system SHALL store the user's resolution action independently from the original AI finding.

#### Scenario: User accepts or rejects an issue
- **WHEN** the user processes an issue
- **THEN** the system records the chosen action and does not overwrite the original finding details

### Requirement: Source distinction
The system SHALL distinguish AI-generated issues from manually created review issues.

#### Scenario: Mixed issue list is shown
- **WHEN** AI and manual issues are displayed together
- **THEN** the user can identify whether each issue came from AI or manual review

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

### Requirement: Reversible resolution contract
The system SHALL store the current issue decision as a reversible resolution state rather than a final locked action.

#### Scenario: User switches issue decision
- **WHEN** the user changes an issue from accepted to rejected or rejected to accepted
- **THEN** the issue stores the latest decision without losing the original finding details

### Requirement: Accepted suggestion snapshot
The system SHALL snapshot the current suggestion text when an issue is accepted.

#### Scenario: User accepts edited suggestion
- **WHEN** the user edits a suggestion and clicks accept
- **THEN** the accepted issue stores the edited suggestion as the text to apply in review-revise mode

