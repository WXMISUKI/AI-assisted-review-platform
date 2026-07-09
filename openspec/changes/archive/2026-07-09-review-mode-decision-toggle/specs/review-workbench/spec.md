## ADDED Requirements

### Requirement: Review mode switch
The system SHALL provide a mode switch between review mode and review-revise mode, with review mode selected by default.

#### Scenario: User opens the application
- **WHEN** the workbench loads
- **THEN** review mode is selected by default

#### Scenario: User switches mode
- **WHEN** the user selects review-revise mode
- **THEN** accepted issues can affect the processed document preview

### Requirement: Reversible issue decision
The system SHALL allow users to switch an issue decision between accepted and rejected without locking the issue card.

#### Scenario: User accepts an issue
- **WHEN** the user clicks accept
- **THEN** the accept button is highlighted and the issue is marked accepted

#### Scenario: User changes accepted issue to rejected
- **WHEN** the user clicks reject on an accepted issue
- **THEN** the reject button is highlighted and the issue is marked rejected

### Requirement: Mode-specific preview behavior
The system SHALL render the processed preview according to the selected mode.

#### Scenario: Review mode preview
- **WHEN** review mode is selected
- **THEN** the preview keeps original document text even if issues are accepted

#### Scenario: Review-revise mode preview
- **WHEN** review-revise mode is selected and an issue is accepted
- **THEN** the preview applies the accepted suggestion text

### Requirement: Manual issue deletion
The system SHALL allow users to delete manually created issues after confirmation.

#### Scenario: User requests deleting a manual issue
- **WHEN** the user clicks delete on a manual issue
- **THEN** the system shows a confirmation prompt before removing the issue

#### Scenario: User confirms deletion
- **WHEN** the user confirms deletion
- **THEN** the manual issue is removed from document highlights, issue cards, filters, and preview calculations

### Requirement: Long document preview
The system SHALL display the processed preview as a continuous document flow suitable for long content.

#### Scenario: Preview is rendered
- **WHEN** the processed preview is displayed
- **THEN** paragraphs appear in document order in a scrollable continuous preview instead of separate cards
