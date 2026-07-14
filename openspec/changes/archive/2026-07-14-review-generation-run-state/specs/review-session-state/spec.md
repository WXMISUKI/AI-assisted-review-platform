# review-session-state Specification

## Purpose

Persist a task-level review generation run snapshot that ties together review preparation, draft issue generation, and workbench recovery.

## Requirements

### Requirement: Review generation run snapshot
The review session state SHALL persist the latest review generation run snapshot on the review task aggregate.

#### Scenario: Review generation starts
- **WHEN** review preparation begins for a document task
- **THEN** the task stores a generation run id, running status, start time, update time, and active stage summary

#### Scenario: Review generation completes
- **WHEN** review preparation and draft issue generation have completed
- **THEN** the task stores a terminal run status, completion time, preparation package id, draft issue generation run id, and generated issue count

### Requirement: Degraded generation is recoverable
The review session state SHALL distinguish degraded generation from failed review tasks.

#### Scenario: Fallback generation completes
- **WHEN** draft issue generation completes through deterministic fallback or no-candidate recovery
- **THEN** the run snapshot can be marked degraded while the task remains available for workbench review

#### Scenario: Generation cannot produce a reviewable state
- **WHEN** review preparation cannot produce usable structure or safe fallback state
- **THEN** the run snapshot can be marked failed with non-secret diagnostics

### Requirement: Run snapshot remains backend-replaceable
The review generation run snapshot SHALL avoid UI-only fields so future backend task APIs can replace local persistence.

#### Scenario: Backend run state is returned
- **WHEN** a future backend API returns review generation run metadata
- **THEN** the session state can map it into the same run snapshot contract without changing page-level consumers
