## ADDED Requirements

### Requirement: Manual text selection annotation
The system SHALL allow users to create a manual review issue from selected text in the document body.

#### Scenario: User selects text in one paragraph
- **WHEN** the user selects text within a single document paragraph
- **THEN** the system captures the paragraph identity, start offset, end offset, and selected text

#### Scenario: User submits manual annotation
- **WHEN** the user fills the manual annotation form and submits it
- **THEN** the system adds a pending manual issue linked to the selected text

#### Scenario: User cancels manual annotation
- **WHEN** the user cancels the selected annotation draft
- **THEN** the system clears the selection draft without adding a review issue

### Requirement: Manual annotation visibility
The system SHALL render newly created manual annotations in both the document and the issue panel.

#### Scenario: Manual issue is created
- **WHEN** a manual issue is added from selected text
- **THEN** the selected text is highlighted in the document and a matching issue card appears in the side panel
 
#### Scenario: Manual issue card is processed
- **WHEN** the user accepts, rejects, or edits a manual issue
- **THEN** the issue follows the same status and preview behavior as AI issues
