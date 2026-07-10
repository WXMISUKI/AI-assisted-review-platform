## ADDED Requirements

### Requirement: Completion gating
The review workbench SHALL enable completion only when every issue has an accepted or rejected decision.

#### Scenario: Issues remain pending
- **WHEN** one or more review issues are pending
- **THEN** the completion action is disabled and shows the remaining pending count

#### Scenario: All issues decided
- **WHEN** every review issue is accepted or rejected
- **THEN** the completion action becomes available

### Requirement: Completion confirmation
The review workbench SHALL ask for confirmation before generating a result asset.

#### Scenario: User clicks completion action
- **WHEN** the user starts completion
- **THEN** the system displays a confirmation dialog explaining the result type that will be generated

### Requirement: Completion payload
The review workbench SHALL emit a completion payload containing mode, issues, decisions, and processed paragraphs.

#### Scenario: User confirms completion
- **WHEN** the user confirms completion
- **THEN** the parent application receives enough data to create the correct report or revised-plan result asset
