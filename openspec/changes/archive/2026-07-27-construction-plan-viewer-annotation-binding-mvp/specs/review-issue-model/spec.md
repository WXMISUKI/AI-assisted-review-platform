## ADDED Requirements

### Requirement: Optional viewer-oriented issue anchor
The review issue model SHALL support an optional viewer-oriented anchor in addition to the existing paragraph anchor.

#### Scenario: Viewer-side issue is created
- **WHEN** a review issue is created or rebound from the source-faithful viewer
- **THEN** the issue can store viewer-oriented location hints without removing the paragraph anchor contract

#### Scenario: Existing task is opened
- **WHEN** an older issue has only a paragraph anchor
- **THEN** the issue remains valid and reviewable without requiring a viewer anchor

### Requirement: Viewer-side manual issues remain structured issues
The review issue model SHALL keep viewer-created manual issues compatible with the existing structured `ReviewIssue` contract.

#### Scenario: User creates a viewer-side manual issue
- **WHEN** the reviewer submits a manual issue from a viewer text selection
- **THEN** the created issue stores `source=manual`, a normal review finding payload, the paragraph anchor when available, and the optional viewer anchor when captured
