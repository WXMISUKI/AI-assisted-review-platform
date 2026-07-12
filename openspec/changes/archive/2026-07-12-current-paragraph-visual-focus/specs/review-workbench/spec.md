## ADDED Requirements

### Requirement: Current paragraph visual emphasis
The review workbench SHALL visually emphasize the current paragraph anchor in the document view.

#### Scenario: A paragraph is active
- **WHEN** the active paragraph anchor changes
- **THEN** the matching document paragraph shows a visible current-state emphasis

### Requirement: Current paragraph exposure
The review workbench SHALL surface the current paragraph anchor in the summary and issue context.

#### Scenario: Summary strip is visible
- **WHEN** a current paragraph anchor exists
- **THEN** the summary area can display the paragraph id or equivalent anchor label

#### Scenario: Issue card is visible
- **WHEN** an issue belongs to the current paragraph
- **THEN** the issue card can display a current-paragraph indicator
