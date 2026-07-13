## ADDED Requirements

### Requirement: Normalized review pipeline snapshot
The review session state SHALL persist a normalized pipeline snapshot alongside the existing task aggregate so loading progress can be restored after refresh.

#### Scenario: Task is reopened after a loading refresh
- **WHEN** the user refreshes or reopens a task while review preparation is in progress
- **THEN** the session state can restore the stage index, stage type, current paragraph, and current section from the stored snapshot

#### Scenario: Legacy task is loaded
- **WHEN** stored review data only contains legacy stream fields
- **THEN** the repository can backfill an equivalent pipeline snapshot without losing resume behavior

### Requirement: Snapshot-backed task recovery
The review session service SHALL keep the pipeline snapshot aligned with task stream updates.

#### Scenario: Backend SSE advances
- **WHEN** the session service records a new loading stage from backend SSE
- **THEN** the updated pipeline snapshot is stored together with the task aggregate

#### Scenario: Mock fallback advances
- **WHEN** the session service falls back to local mock stages
- **THEN** the same pipeline snapshot contract remains usable for restore and reopen
