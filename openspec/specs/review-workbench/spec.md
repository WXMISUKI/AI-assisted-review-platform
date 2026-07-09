# review-workbench Specification

## Purpose
TBD - created by archiving change interactive-review-mvp. Update Purpose after archive.
## Requirements
### Requirement: Review workbench layout
The system SHALL present a usable construction plan review workbench as the first screen, with project context, review progress, document content, and issue handling controls visible without a marketing or landing page.

#### Scenario: User opens the application
- **WHEN** the user opens the MVP application
- **THEN** the system displays the construction plan document area and the review issue panel

### Requirement: Inline issue highlighting
The system SHALL render AI and manual review issues at their corresponding document text positions using visually distinct inline markers.

#### Scenario: Pending issue is rendered
- **WHEN** a pending issue has an anchor pointing to a paragraph text range
- **THEN** the anchored text is displayed with a visible warning marker

#### Scenario: Resolved issue is rendered
- **WHEN** an issue is accepted or rejected
- **THEN** the document marker reflects the resolved status without losing the location relationship

### Requirement: Bidirectional issue navigation
The system SHALL link document markers and side-panel issue cards so users can move between the problem location and its explanation.

#### Scenario: User selects an issue card
- **WHEN** the user clicks an issue card in the side panel
- **THEN** the document scrolls to the anchored paragraph and visually focuses the matching issue

#### Scenario: User selects a document marker
- **WHEN** the user clicks a highlighted issue marker in the document
- **THEN** the matching side-panel card becomes the active issue

### Requirement: Issue status filtering
The system SHALL allow users to filter review issues by processing status.

#### Scenario: User filters pending issues
- **WHEN** the user selects the pending filter
- **THEN** only pending issue cards are shown in the side panel

### Requirement: Issue handling actions
The system SHALL support accepting an AI suggestion, rejecting an issue, and editing a suggestion before accepting it.

#### Scenario: User accepts an AI suggestion
- **WHEN** the user clicks accept on a pending issue
- **THEN** the issue status changes to accepted and the processed document preview uses the suggested replacement

#### Scenario: User rejects an issue
- **WHEN** the user clicks reject on a pending issue
- **THEN** the issue status changes to rejected and the processed document preview keeps the original text

#### Scenario: User edits and accepts a suggestion
- **WHEN** the user changes the suggestion text and clicks modified accept
- **THEN** the issue status changes to modified and the processed document preview uses the user-edited replacement

### Requirement: Processed document preview
The system SHALL show a preview of the processed construction plan text based on issue actions.

#### Scenario: User resolves issues
- **WHEN** one or more issues are accepted or modified
- **THEN** the processed preview reflects the accepted or modified replacements in document order

### Requirement: Review progress summary
The system SHALL display a review progress summary based on issue statuses.

#### Scenario: User changes issue status
- **WHEN** an issue status changes
- **THEN** the progress summary updates pending, accepted, rejected, and modified counts

