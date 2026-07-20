## ADDED Requirements

### Requirement: Construction-plan library visual restoration
The construction-plan document library SHALL render styled enterprise controls and list hierarchy after the historical workspace restoration.

#### Scenario: Upload panel is shown
- **WHEN** the construction-plan document library renders its upload panel
- **THEN** the upload dropzone, native file picker trigger, document name input, project name input, staged file summary, and add-document action use the platform's styled control treatment rather than browser-default controls

#### Scenario: Document list is shown
- **WHEN** construction-plan tasks are listed in the document library
- **THEN** each task row has a visible surface background, border, status chips, lifecycle text, and aligned action buttons

#### Scenario: Theme changes
- **WHEN** the user switches between light and dark themes
- **THEN** document library controls and task rows continue using semantic tokens for surface, border, text, and button colors

### Requirement: Visual change governance
The platform SHALL require explicit discussion and an OpenSpec change before major changes to shared components, platform shell structure, navigation presentation, or mature page visual style.

#### Scenario: Developer proposes a major visual change
- **WHEN** a change would alter shared component classes, app shell layout, product navigation, or the established display style of a mature workflow
- **THEN** the change is captured in OpenSpec and discussed before implementation begins

#### Scenario: Developer applies a minor style fix
- **WHEN** a change only restores missing styling, fixes a visual regression, or aligns existing classes with documented tokens
- **THEN** the change may proceed under a focused restoration spec without redesigning the workflow
