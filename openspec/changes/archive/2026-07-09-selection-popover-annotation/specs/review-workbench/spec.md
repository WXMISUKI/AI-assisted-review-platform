## ADDED Requirements

### Requirement: Selection anchored annotation popover
The system SHALL display the manual annotation form near the selected document text instead of moving the user to a top-of-document form.

#### Scenario: User selects valid text
- **WHEN** the user selects valid text within one document paragraph
- **THEN** the system displays a manual annotation popover anchored near the selected text

#### Scenario: Selection is near viewport edge
- **WHEN** the selected text is close to a viewport edge
- **THEN** the popover remains visible within the viewport bounds

#### Scenario: User creates annotation from popover
- **WHEN** the user submits the popover form
- **THEN** the system creates the manual issue and closes the popover without scrolling the document to the top

#### Scenario: User cancels annotation from popover
- **WHEN** the user cancels the popover form
- **THEN** the system clears the selection draft and removes the popover
