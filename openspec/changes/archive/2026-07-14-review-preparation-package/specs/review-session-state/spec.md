# review-session-state Specification

## Purpose

Persist a review-preparation package on the review task aggregate so OCR-derived review preparation can be restored and later replaced by backend orchestration.

## Requirements

### Requirement: Review-preparation package state
The review session state SHALL store a review-preparation package on the task aggregate once OCR-derived review preparation completes.

#### Scenario: Backend preparation completes
- **WHEN** backend review-preparation events complete for a task with recovered structure
- **THEN** the session state stores a package containing the preparation source, status, structure summary, stage events, issue summaries, safe provider summary, and completion timestamps

#### Scenario: Backend stream is unavailable
- **WHEN** backend review-preparation streaming fails or times out
- **THEN** the session state can store a local fallback package derived from existing structure-aware loading stages

### Requirement: Session snapshot exposes preparation package
The review session snapshot SHALL expose the persisted review-preparation package to page-level consumers.

#### Scenario: Task is reopened
- **WHEN** the user refreshes or reopens a task after review preparation completed
- **THEN** the session snapshot includes the persisted preparation package without recomputing the preparation stages

#### Scenario: Package is absent
- **WHEN** a task has no preparation package
- **THEN** the session service falls back to the existing recovered structure, issue drafts, and pipeline snapshot behavior

### Requirement: Backend-replaceable package contract
The review-preparation package SHALL avoid UI-only fields so future backend APIs can replace the mock persistence layer.

#### Scenario: Backend returns package payload
- **WHEN** a future backend API returns package metadata for a review task
- **THEN** the session state can map it into the same package contract used by the local flow
