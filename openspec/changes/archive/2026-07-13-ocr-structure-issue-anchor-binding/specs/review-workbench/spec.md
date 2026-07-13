## MODIFIED Requirements

### Requirement: Bidirectional issue navigation
The system SHALL link document markers and side-panel issue cards so users can move between the problem location and its explanation, including recovered OCR paragraphs.

#### Scenario: User selects an issue card
- **WHEN** the user clicks an issue card in the side panel
- **THEN** the document scrolls to the anchored paragraph and visually focuses the matching issue

#### Scenario: User selects a document marker
- **WHEN** the user clicks a highlighted issue marker in the document
- **THEN** the matching side-panel card becomes the active issue

### Requirement: Section-linked issue grouping
The review workbench SHALL group issues in the side panel by their document section when section information is available.

#### Scenario: Issues belong to sections
- **WHEN** the workbench has recovered sections or paragraph section labels
- **THEN** the issue panel shows section headers with the issue cards belonging to each section

#### Scenario: Section data is unavailable
- **WHEN** the workbench cannot determine section boundaries
- **THEN** the issue panel can fall back to the existing flat list without blocking review actions
