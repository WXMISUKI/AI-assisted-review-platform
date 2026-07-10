## MODIFIED Requirements

### Requirement: Selection anchored annotation popover
The system SHALL display the manual annotation form near the selected document text instead of moving the user to a top-of-document form.

#### Scenario: User selects valid text
- **WHEN** the user selects valid text within one document paragraph
- **THEN** the system displays a manual annotation popover anchored near the selected text

#### Scenario: Selection is near viewport edge
- **WHEN** the selected text is close to a viewport edge
- **THEN** the popover remains visible within the viewport bounds

### Requirement: Reversible issue decision
The system SHALL allow users to switch an issue decision between accepted and rejected without locking the issue card.

#### Scenario: User accepts an issue
- **WHEN** the user clicks accept
- **THEN** the accept button is highlighted and the issue is marked accepted

#### Scenario: User changes accepted issue to rejected
- **WHEN** the user clicks reject on an accepted issue
- **THEN** the reject button is highlighted and the issue is marked rejected

#### Scenario: User changes rejected issue back to accepted
- **WHEN** the user clicks accept on a rejected issue
- **THEN** the accept button is highlighted and the issue returns to the accepted state

### Requirement: Manual issue deletion
The system SHALL allow users to delete manually created issues after confirmation.

#### Scenario: User requests deleting a manual issue
- **WHEN** the user clicks delete on a manual issue
- **THEN** the system shows a confirmation prompt before removing the issue

### Requirement: Mode-specific preview behavior
The system SHALL render the processed preview according to the selected mode.

#### Scenario: Review mode preview
- **WHEN** review mode is selected
- **THEN** the preview keeps original document text even if issues are accepted

#### Scenario: Review-revise mode preview
- **WHEN** review-revise mode is selected and an issue is accepted
- **THEN** the preview applies the accepted suggestion text

### Requirement: Long document preview
The system SHALL display the processed preview as a continuous document flow suitable for long content.

#### Scenario: Preview is rendered
- **WHEN** the processed preview is displayed
- **THEN** paragraphs appear in document order in a scrollable continuous preview instead of separate cards

## ADDED Requirements

### Requirement: Draggable annotation popover
The system SHALL allow the manual annotation popover to be dragged without losing the current selection draft.

#### Scenario: User drags the popover
- **WHEN** the user drags the popover header to a new position
- **THEN** the popover moves to the new position and keeps the selected text context intact
