## MODIFIED Requirements

### Requirement: Enriched review progress events
The backend SHALL expose review progress events that can identify the current stage, current paragraph or section, active agent role, and current issue summaries.

#### Scenario: Client subscribes with structure summary
- **WHEN** a client connects to the review streaming endpoint with section and paragraph summary metadata
- **THEN** the backend can emit review-preparation events whose stage metadata reflects the supplied recovered-structure summary

#### Scenario: Client subscribes without structure summary
- **WHEN** a legacy client connects without structure metadata
- **THEN** the backend continues to emit deterministic connectivity events with backward-compatible basic progress fields

#### Scenario: Review progress reaches a ready state
- **WHEN** the pipeline completes
- **THEN** the backend emits a completion event with completion time and closes the connection
