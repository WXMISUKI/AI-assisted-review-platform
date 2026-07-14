# review-session-state Specification

## Purpose

Define safe retry behavior for failed review generation runs while preserving reviewable degraded runs.

## Requirements

### Requirement: Failed generation retry starts a fresh run
The review session state SHALL start a fresh review generation run when a user retries after a failed terminal run.

#### Scenario: Failed run is retried
- **WHEN** a task has a failed review generation run and the user starts review generation again
- **THEN** the task receives a new generation run id, running status, fresh timestamps, and no stale run diagnostics

#### Scenario: Existing task data is preserved
- **WHEN** a failed run is retried
- **THEN** existing issues, manual decisions, preparation package snapshots, and result assets are not destructively removed by the retry action

### Requirement: Degraded generation remains reviewable
The review session state SHALL treat degraded generation as a recoverable review state rather than a failed task.

#### Scenario: Degraded run is reopened
- **WHEN** a task has a degraded review generation run and reviewable document state
- **THEN** the session state allows the workbench to open without requiring retry first

### Requirement: Legacy retry fallback
The review session state SHALL preserve existing task-status behavior when no review generation run snapshot exists.

#### Scenario: Older failed task is retried
- **WHEN** a failed task has no review generation run snapshot
- **THEN** the retry action can still enter the existing review start flow
