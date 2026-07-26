## ADDED Requirements

### Requirement: Issue supporting evidence disclosure
The review workbench SHALL allow reviewers to inspect supporting retrieval evidence for an issue without changing the issue decision workflow.

#### Scenario: User expands supporting evidence
- **WHEN** a review issue card is expanded for supporting evidence
- **THEN** the workbench requests task-scoped supporting retrieval hits for that issue
- **AND** displays only safe hit fields such as title, safe snippet, locator, provider, and score

#### Scenario: No supporting evidence is recalled
- **WHEN** the supporting evidence request completes with zero hits
- **THEN** the workbench shows a clear empty-state message and keeps the issue decision actions unchanged

#### Scenario: Provider is unavailable
- **WHEN** the knowledge-base provider is disabled, degraded, or request processing fails
- **THEN** the workbench shows a safe degraded message and does not block review actions
