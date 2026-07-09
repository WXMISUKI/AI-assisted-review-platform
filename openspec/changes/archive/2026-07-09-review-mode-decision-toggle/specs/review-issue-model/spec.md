## ADDED Requirements

### Requirement: Reversible resolution contract
The system SHALL store the current issue decision as a reversible resolution state rather than a final locked action.

#### Scenario: User switches issue decision
- **WHEN** the user changes an issue from accepted to rejected or rejected to accepted
- **THEN** the issue stores the latest decision without losing the original finding details

### Requirement: Accepted suggestion snapshot
The system SHALL snapshot the current suggestion text when an issue is accepted.

#### Scenario: User accepts edited suggestion
- **WHEN** the user edits a suggestion and clicks accept
- **THEN** the accepted issue stores the edited suggestion as the text to apply in review-revise mode
