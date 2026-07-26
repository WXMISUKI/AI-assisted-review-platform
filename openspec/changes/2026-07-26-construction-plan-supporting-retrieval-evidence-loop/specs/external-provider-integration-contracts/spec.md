## ADDED Requirements

### Requirement: Task-scoped supporting retrieval evidence
The system SHALL expose task-scoped supporting retrieval evidence for review issues through a platform-owned backend endpoint.

#### Scenario: Issue supporting evidence is requested
- **WHEN** the frontend requests supporting evidence for a review task issue
- **THEN** the backend derives the retrieval query from platform-owned task and issue context
- **AND** invokes the configured knowledge-base provider through the existing adapter boundary
- **AND** returns only normalized safe hits and safe status metadata

#### Scenario: Supporting evidence conflicts with platform conclusions
- **WHEN** provider retrieval hits differ from the active issue basis, human decision, or platform facts
- **THEN** the system presents those hits only as supporting recall and preserves platform-owned conclusions as authoritative
