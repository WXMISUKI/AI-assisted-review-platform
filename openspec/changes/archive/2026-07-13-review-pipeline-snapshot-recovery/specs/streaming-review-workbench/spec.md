## ADDED Requirements

### Requirement: Snapshot-backed loading recovery
The streaming review workbench SHALL resume locked loading views from the normalized pipeline snapshot when it is available.

#### Scenario: Locked task is reopened
- **WHEN** a user reopens a parsing or review-preparation task after refresh
- **THEN** the loading view can restore the last known stage index, stage label, and paragraph context from the stored snapshot

#### Scenario: Snapshot is unavailable
- **WHEN** a task has no snapshot yet
- **THEN** the loading view can continue using the existing stage progression fallback without changing the page contract
