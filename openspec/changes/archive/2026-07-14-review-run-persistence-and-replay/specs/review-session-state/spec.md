# review-session-state Specification

## Purpose

Allow the frontend session state to recover review-loading progress from persisted backend run state and replayed events.

## Requirements

### Requirement: Loading state can recover from backend run replay
The review session state SHALL be able to rebuild locked loading progress from persisted backend generation run status and events.

#### Scenario: Loading page is refreshed
- **WHEN** the user refreshes or reopens a task whose backend generation run is still running
- **THEN** the session state can use run status and replayed events to restore progress, active stage, current section or paragraph, and recent activity summaries

#### Scenario: Stream reconnects
- **WHEN** the run SSE connection is interrupted and later reconnects
- **THEN** replayed events can update the same session state shape as live events

### Requirement: Replayed completion is idempotent
The review session state SHALL avoid applying the same backend run completion more than once.

#### Scenario: Completion event is replayed
- **WHEN** a terminal event for a run is received after the frontend already applied that run completion
- **THEN** preparation package persistence, draft issue merge, run terminal snapshot, and activity append are not duplicated

### Requirement: Run recovery keeps fallback behavior
The review session state SHALL preserve existing local fallback behavior when backend run recovery is unavailable.

#### Scenario: Run status cannot be recovered
- **WHEN** the backend run status, events, or stream replay endpoint is unreachable
- **THEN** the frontend can keep using the existing local review-loading fallback without corrupting the task aggregate
