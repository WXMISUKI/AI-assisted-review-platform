## ADDED Requirements

### Requirement: Scroll-driven section synchronization
The review workbench SHALL update the active section context from the current scroll position inside the document view.

#### Scenario: User scrolls the document
- **WHEN** the user scrolls through the document body
- **THEN** the workbench updates the active section to the section that contains the currently visible paragraph

#### Scenario: User jumps to a paragraph
- **WHEN** the user clicks a section or issue and the document scrolls to a paragraph
- **THEN** the active section context follows the target paragraph after scrolling settles
