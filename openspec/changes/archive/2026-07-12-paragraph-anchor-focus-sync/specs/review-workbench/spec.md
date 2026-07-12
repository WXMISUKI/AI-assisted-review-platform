## ADDED Requirements

### Requirement: Paragraph anchor focus synchronization
The review workbench SHALL maintain a current paragraph anchor that follows scroll position and direct user focus actions.

#### Scenario: User scrolls the document
- **WHEN** the user scrolls through the document body
- **THEN** the workbench updates the current paragraph anchor to the visible paragraph closest to the reading focus

#### Scenario: User clicks a section or issue
- **WHEN** the user clicks a section, an issue card, or a highlighted issue in the document
- **THEN** the workbench updates the current paragraph anchor to the targeted paragraph

### Requirement: Paragraph, section, and issue focus relation
The review workbench SHALL keep the active paragraph anchor, active section, and active issue context aligned when one of them changes.

#### Scenario: Focus changes by paragraph
- **WHEN** the current paragraph anchor changes
- **THEN** the corresponding section and related issue group can be promoted to the active context

#### Scenario: Focus changes by issue
- **WHEN** the user focuses an issue
- **THEN** the issue's anchor paragraph becomes the current paragraph anchor
