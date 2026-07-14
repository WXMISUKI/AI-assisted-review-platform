# review-session-state Specification

## Purpose
Define the review task aggregate, session service boundary, and recoverable loading snapshot used by the review workflow.
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

### Requirement: Backend-owned review task snapshots
The review session state SHALL support loading and saving review task snapshots through a backend persistence contract.

#### Scenario: Backend task snapshots are available
- **WHEN** the frontend session repository loads review tasks and the backend returns persisted task snapshots
- **THEN** the session state uses those backend snapshots as the primary task source

#### Scenario: Backend task snapshots are unavailable
- **WHEN** the backend task persistence endpoint fails or is unreachable
- **THEN** the session state falls back to localStorage or seeded tasks without blocking the workbench

### Requirement: Session aggregate shape is preserved
The backend task snapshot SHALL preserve the existing review task aggregate fields used by the session service.

#### Scenario: Generated review state is persisted
- **WHEN** a task has review generation run state, activity trail, preparation package, draft issue snapshot, generated issues, OCR job, source object, failure, or result asset
- **THEN** backend persistence can store and return those fields without requiring page-level remapping

### Requirement: Save remains compatible with synchronous session service flows
The review session state SHALL keep existing synchronous session service operations usable while backend persistence is introduced.

#### Scenario: Task state is saved
- **WHEN** a session service operation mutates task state
- **THEN** local state updates immediately and backend persistence can be synchronized as a best-effort side effect in this foundation slice

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

### Requirement: Draft issue generation snapshot
The review session state SHALL persist the latest draft issue generation snapshot on the review task aggregate.

#### Scenario: Candidate generation completes
- **WHEN** backend draft issue generation returns candidates or fallback diagnostics
- **THEN** the task stores generation source, status, diagnostics, generated issue ids, candidate count, preparation package id, and timestamps

#### Scenario: Generation produces no issues
- **WHEN** the adapter returns no valid generated issues
- **THEN** the task still can store a safe generation snapshot without blocking workbench entry

### Requirement: Reopen uses stored generation state
The review session state SHALL expose draft issue generation state when a task is reopened.

#### Scenario: Task is reopened
- **WHEN** a task already has a draft issue generation snapshot
- **THEN** the session snapshot exposes it without requiring generation to run again

### Requirement: Generated candidate merge
The review session state SHALL merge generated AI issue candidates into the review task aggregate through a service operation.

#### Scenario: Valid candidates are returned
- **WHEN** backend draft issue generation returns validated candidates
- **THEN** the session service merges them with existing task issues and updates issue counts

#### Scenario: Generation falls back
- **WHEN** backend generation returns deterministic fallback or cannot be reached
- **THEN** the session state preserves existing deterministic draft issues and keeps the task available for workbench review

### Requirement: Candidate generation recovery
The review session state SHALL not require candidate generation to be repeated on every task reopen.

#### Scenario: Task is reopened after candidates are stored
- **WHEN** the user reopens a task that already has generated candidates
- **THEN** the session snapshot exposes the persisted issues without calling the adapter again

### Requirement: Review task aggregate
The system SHALL represent each document review as a review task aggregate containing document metadata, lifecycle status, role-compatible mode, review session data, and optional result asset.

#### Scenario: Task is listed
- **WHEN** the document library requests review tasks
- **THEN** each task includes document name, project name, uploader, updated time, status, review mode, issue count, and optional result asset metadata

#### Scenario: Task is opened
- **WHEN** a user opens a review task
- **THEN** the system can load the task's paragraphs, issues, current resolutions, streaming state, and result asset from the same aggregate

### Requirement: Review session service boundary
The system SHALL expose review workflow operations through a session service instead of requiring page components to assemble business state directly.

#### Scenario: Document task is created
- **WHEN** a user uploads or adds a document
- **THEN** the session service creates a review task with seeded document metadata and initial mock review data

#### Scenario: Review task is started
- **WHEN** a user starts review for a task
- **THEN** the session service marks the task as reviewing and provides ordered streaming events

#### Scenario: Issue decision is updated
- **WHEN** a user accepts or rejects an issue
- **THEN** the session service stores the updated issue resolution for that task

#### Scenario: Review is completed
- **WHEN** a user confirms completion
- **THEN** the session service stores the generated result asset and marks the task completed

### Requirement: Mock persistence
The system SHALL persist mock review task state in browser storage for MVP testing.

#### Scenario: User refreshes after editing
- **WHEN** a user refreshes the page after creating a task, resolving issues, or generating a result
- **THEN** the document library and task state are restored from mock persistence

#### Scenario: Stored data is invalid
- **WHEN** stored mock review data cannot be parsed or has an unsupported schema version
- **THEN** the system falls back to seeded mock tasks without blocking the UI

### Requirement: Backend-replaceable contract
The review session state contract SHALL avoid UI-only fields that prevent later replacement by backend APIs.

#### Scenario: Backend integration begins
- **WHEN** a future backend replaces the mock repository
- **THEN** the UI can continue using the same service-level operations for task listing, task loading, issue resolution, streaming updates, and completion

### Requirement: Backend event compatibility
The review session state SHALL reserve a backend event contract compatible with future replacement of mock streaming updates.

#### Scenario: Backend review event is received
- **WHEN** a backend event contains stage id, title, detail, progress, and issue summaries
- **THEN** it can be mapped to the existing review session streaming state without changing page-level UI contracts

### Requirement: Review pipeline snapshot
The review session state SHALL preserve a pipeline snapshot alongside the existing task aggregate so the UI can restore post-OCR progress after refresh.

#### Scenario: Task is reopened mid-pipeline
- **WHEN** the user refreshes or reopens an in-progress document
- **THEN** the task state restores the current pipeline stage, progress, and paragraph context

#### Scenario: Pipeline state is mutated
- **WHEN** the review session service advances the pipeline
- **THEN** the updated snapshot remains replaceable by future backend APIs without changing page-level state assembly

### Requirement: Backend-replaceable streaming contract
The review session state SHALL remain compatible with a backend event stream that can carry stage, paragraph, and agent metadata.

#### Scenario: Backend event is mapped
- **WHEN** a backend progress event is received
- **THEN** the session state can map it into the same restored task snapshot used by the mock flow

### Requirement: Recovered structure snapshot
The review session state SHALL persist a recovered-structure snapshot alongside task progress state.

#### Scenario: Task is reopened mid-recovery
- **WHEN** the user refreshes during structure recovery
- **THEN** the session state restores the recovered paragraphs, active section, and current recovery stage

#### Scenario: Task enters review preparation after OCR hydration
- **WHEN** OCR hydration stores recovered sections and paragraphs on the task aggregate
- **THEN** review-preparation stage snapshots use that recovered structure as their current paragraph and section source

### Requirement: Backend-replaceable structure state
The session state SHALL keep the recovered-structure contract compatible with a future backend implementation.

#### Scenario: Backend sends recovered structure
- **WHEN** a backend event delivers recovered paragraphs or section boundaries
- **THEN** the session state can hydrate the same structure snapshot used by the mock flow

### Requirement: Recovered issue anchor rebinding
The review session state SHALL reuse recovered structure to rebind compatible issue anchors before the workbench opens.

#### Scenario: OCR hydration completes
- **WHEN** the task receives a hydrated recovered structure
- **THEN** the session state can align existing issue anchors to recovered paragraphs before the workbench renders

#### Scenario: No recovered match exists
- **WHEN** an issue cannot be matched to a recovered paragraph
- **THEN** the session state preserves the original issue semantics and falls back to a safe paragraph anchor

### Requirement: Structure-driven issue drafts
The review session state SHALL add deterministic issue drafts from recovered structure before the workbench opens.

#### Scenario: Drafts are generated
- **WHEN** OCR hydration produces recovered paragraphs that match known review-risk patterns
- **THEN** the session state can append deterministic draft issues with stable ids and anchors

#### Scenario: Draft generation finds no matches
- **WHEN** the recovered structure does not trigger any draft rules
- **THEN** the session state preserves the existing issue list without fabricating new issues

### Requirement: Structure-driven loading issue summaries
The review session state SHALL expose draft issue summaries derived from recovered structure so the review-preparation loading flow can reflect real risk signals.

#### Scenario: Draft issues are available
- **WHEN** OCR hydration produces recovered paragraphs that match known review-risk patterns
- **THEN** the review-preparation summary can reuse deterministic draft issue titles or short labels from the recovered structure

#### Scenario: No draft issues are generated
- **WHEN** the recovered structure does not trigger any draft rules
- **THEN** the loading summary preserves the existing stage templates and fallback progress hints

### Requirement: OCR result hydration in session state
The review session service SHALL support hydrating recovered structure from a completed OCR result before review analysis begins.

#### Scenario: OCR job completes successfully
- **WHEN** the OCR job reaches `done` and a `resultUrl.jsonUrl` is available
- **THEN** the session state can store the hydrated recovered structure snapshot alongside the task aggregate

#### Scenario: OCR hydration fails
- **WHEN** OCR result hydration fails due to remote fetch or parse errors
- **THEN** the task remains visible with a non-secret failure message and can still fall back to the existing mock recovery path

### Requirement: Session-backed workbench entry
The review session state SHALL provide a normalized session snapshot to the review workbench when a task is opened.

#### Scenario: A task is opened for review
- **WHEN** the user opens a ready review task
- **THEN** the session service can provide the recovered paragraphs, rebounded issues, and current pipeline context used to initialize the workbench

#### Scenario: Session snapshot is unavailable
- **WHEN** the session snapshot cannot be derived
- **THEN** the workbench may fall back to the task aggregate and recovered structure without blocking entry

### Requirement: Session-backed result entry
The review session state SHALL provide a normalized result snapshot to the review result preview when a completed task is opened.

#### Scenario: A completed task is opened for results
- **WHEN** the user opens a completed review task from the document library
- **THEN** the session service can provide the stored result asset and task metadata used to initialize the result preview

#### Scenario: Result snapshot is unavailable
- **WHEN** the result snapshot cannot be derived
- **THEN** the result preview may fall back to the persisted task aggregate without blocking entry

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

### Requirement: Backend run completion maps to task session state
The review session state SHALL consume backend generation run completion payloads through existing service-level operations.

#### Scenario: Backend run completes ready
- **WHEN** a run-specific stream completion contains a ready status, preparation package, and draft issue generation output
- **THEN** the frontend persists the package, merges generated issues, stores draft issue generation snapshot, marks the generation run ready, and appends safe activity events through the session service

#### Scenario: Backend run completes degraded
- **WHEN** a run-specific stream completion contains a degraded status with safe diagnostics or fallback issue output
- **THEN** the frontend keeps the task reviewable, stores safe diagnostics, and marks the generation run degraded through the session service

### Requirement: Backend run failure remains retryable
The review session state SHALL treat backend run bridge failures as retryable generation failures or fall back to the existing local flow when safe.

#### Scenario: Run stream fails before usable package
- **WHEN** the run-specific stream fails before a reviewable preparation package exists
- **THEN** the task can be marked failed with safe diagnostics and exposed through the existing retry action

#### Scenario: Run bridge is unavailable
- **WHEN** the backend run creation or stream subscription fails
- **THEN** the frontend may fall back to the existing review-agent stream and local preparation flow without corrupting the current generation run

### Requirement: Backend completion does not duplicate draft issue generation
The review session state SHALL avoid generating or merging draft issues twice for the same backend generation run.

#### Scenario: Completion already includes draft output
- **WHEN** the run-specific stream provides draft issue generation output
- **THEN** the frontend does not call the standalone draft issue endpoint for the same run

#### Scenario: Completion lacks draft output
- **WHEN** a stream completion provides only a preparation package
- **THEN** the frontend may use the existing standalone draft issue endpoint as a compatibility fallback

### Requirement: Backend run completion materializes task aggregate
The review session state SHALL allow backend completed generation runs to update the persisted review task aggregate without requiring a live browser SSE consumer.

#### Scenario: Backend run completes with draft issues
- **WHEN** a backend generation run reaches a ready or degraded terminal completion with a preparation package and draft issue generation payload
- **THEN** the matching review task stores the package, generated issues, draft issue snapshot, terminal run snapshot, and safe activity events

#### Scenario: User reopens after browser disconnect
- **WHEN** the user later opens a task whose backend run already materialized
- **THEN** the session state can load the persisted task with generated issues already present

### Requirement: Backend materialization is idempotent
The review session state SHALL not duplicate issues, draft snapshots, or activity events when the same run completion is applied more than once.

#### Scenario: Completion is applied twice
- **WHEN** backend materialization and frontend SSE completion both process the same draft issue generation run id
- **THEN** the task keeps one draft snapshot and one set of generated issue candidates
