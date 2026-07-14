# review-issue-model Delta

## ADDED Requirements

### Requirement: Backend-owned issue resolution
The review issue model SHALL support backend-owned issue resolution that stores the reviewer decision separately from the original finding.

#### Scenario: Reviewer resolves an issue
- **WHEN** a reviewer accepts or rejects an issue through the backend API
- **THEN** the issue stores the latest status, resolution action, edited text for accepted issues, and resolved timestamp without overwriting finding details

### Requirement: Backend-owned manual issue lifecycle
The review issue model SHALL support backend-owned manual issue creation and deletion.

#### Scenario: Manual issue is created through the backend
- **WHEN** a reviewer submits a manual issue
- **THEN** the backend stores it with `source` set to `manual`, pending status if unresolved, and a valid structured issue shape

#### Scenario: Manual issue is deleted through the backend
- **WHEN** a reviewer deletes an issue whose source is `manual`
- **THEN** the backend removes the issue and refreshes task issue counts

#### Scenario: AI issue deletion is requested
- **WHEN** a reviewer attempts to delete an AI-generated issue
- **THEN** the backend rejects the operation with a safe `not_allowed` error
