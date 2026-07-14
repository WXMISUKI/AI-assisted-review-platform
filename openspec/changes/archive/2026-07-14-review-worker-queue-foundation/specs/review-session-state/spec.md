# review-session-state Specification

## Purpose

Keep frontend review session state idempotent and stable while backend generation execution becomes queue-backed.

## Requirements

### Requirement: Queue retries do not duplicate terminal state
The review session state SHALL treat repeated terminal completion for the same backend generation run as idempotent.

#### Scenario: Retried job replays completion
- **WHEN** a retried or reconnected backend job causes a terminal run event to be replayed for a run already applied locally
- **THEN** the session state does not duplicate preparation package persistence, generated issue merge, terminal run snapshot, or activity events

### Requirement: Queue diagnostics do not replace run state
The review session state SHALL continue to use generation run status and events as the workflow source of truth.

#### Scenario: Queue status is available
- **WHEN** queue diagnostics report queued, leased, running, retryable failed, or dead-lettered jobs
- **THEN** the loading and workbench state still derives user workflow behavior from run status and persisted run events

### Requirement: Existing fallback remains available
The review session state SHALL preserve existing local fallback behavior when queue-backed execution is unavailable.

#### Scenario: Enqueue or worker loop fails
- **WHEN** run creation, job enqueue, queue status, or worker execution cannot complete
- **THEN** the frontend can use existing run recovery or local preparation fallback without corrupting the task aggregate
