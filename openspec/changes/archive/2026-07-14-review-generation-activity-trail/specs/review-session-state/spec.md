# review-session-state Specification

## Purpose

Persist a safe review generation activity trail that explains task generation lifecycle transitions across starts, retries, degraded recovery, failure, and completion.

## Requirements

### Requirement: Review generation activity trail
The review session state SHALL persist a safe activity trail for review generation lifecycle events on the review task aggregate.

#### Scenario: Generation lifecycle event occurs
- **WHEN** review generation starts, advances, persists a package, generates draft issues, completes, degrades, fails, or retries
- **THEN** the task can append a safe activity event with event type, time, run id, and relevant non-secret metadata

#### Scenario: Task is reopened
- **WHEN** a task with generation activities is reopened
- **THEN** the review session snapshot exposes the activity trail to page-level consumers

### Requirement: Activity trail remains safe
The review generation activity trail SHALL store only safe lifecycle summaries.

#### Scenario: Provider diagnostics exist
- **WHEN** an activity event is created from provider or generation diagnostics
- **THEN** it stores only safe status/message/count identifiers and excludes prompts, secrets, provider raw traces, raw document text, and private object URLs

### Requirement: Legacy tasks tolerate missing activities
The review session state SHALL treat missing review generation activities as an empty trail.

#### Scenario: Older task is loaded
- **WHEN** a task was created before activity trail support
- **THEN** session loading and workbench entry continue without requiring activity records
