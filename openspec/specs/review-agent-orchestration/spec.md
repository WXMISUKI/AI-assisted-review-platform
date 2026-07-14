# review-agent-orchestration Specification

## Purpose
TBD - created by archiving change review-orchestration-streaming-progress. Update Purpose after archive.
## Requirements
### Requirement: Review generation runs are backed by queued jobs
The review orchestration layer SHALL enqueue a bounded review-generation job when a backend generation run is created.

#### Scenario: Run creation enqueues work
- **WHEN** the frontend creates a backend review generation run
- **THEN** the backend creates the persisted run record and enqueues a review-generation job associated with that run id and task id

#### Scenario: Run is already terminal
- **WHEN** a worker claims a job whose associated run has already reached ready, degraded, failed, or expired status
- **THEN** the worker marks the job as safely completed or skipped without re-emitting duplicate terminal events

### Requirement: Worker leasing controls job ownership
The review orchestration layer SHALL support explicit job leasing before a worker executes generation work.

#### Scenario: Worker claims a job
- **WHEN** a due queued job is available
- **THEN** one worker can claim it with a worker id, lease timestamp, lease expiry, and incremented attempt count

#### Scenario: Lease expires
- **WHEN** a leased job does not heartbeat before its lease expiry
- **THEN** the queue can make it available for retry unless the job has reached max attempts

### Requirement: Job retry and terminal states are explicit
The review orchestration layer SHALL distinguish successful, retryable failed, dead-lettered, canceled, and skipped worker jobs.

#### Scenario: Job fails below max attempts
- **WHEN** generation execution fails before max attempts are exhausted
- **THEN** the job stores a safe error summary and becomes retryable after a bounded delay

#### Scenario: Job exhausts retries
- **WHEN** generation execution fails after max attempts are exhausted
- **THEN** the job becomes dead-lettered and the associated run records a safe failed terminal state

### Requirement: Queue contract is Python-worker compatible
The queued job contract SHALL be replaceable by a future Python worker or production queue runtime.

#### Scenario: Python worker is introduced later
- **WHEN** a Python worker claims, heartbeats, emits progress, completes, or fails a review-generation job
- **THEN** it can use the same run id, job id, event, retry, and safe diagnostic contract without changing frontend loading consumers

### Requirement: Backend-owned generation run records
The review orchestration layer SHALL persist review generation run records independently of a single SSE connection.

#### Scenario: Generation run is created
- **WHEN** the frontend creates a backend review generation run
- **THEN** the backend stores a schema-versioned run record with task id, run id, mode, initial status, timestamps, structure summary, accepted input counts, and safe bounds

#### Scenario: Generation run is reopened
- **WHEN** the frontend requests a previously created run by id
- **THEN** the backend returns safe latest run state without requiring the original stream connection

### Requirement: Generation run lifecycle remains recoverable
The review orchestration layer SHALL keep latest run lifecycle state recoverable until the run expires or is pruned.

#### Scenario: Stage advances
- **WHEN** the backend generation bridge advances a preparation or draft issue stage
- **THEN** the persisted run record updates latest status, progress, active stage, update time, and safe stage summary

#### Scenario: Terminal state is reached
- **WHEN** generation becomes ready, degraded, or failed
- **THEN** the run record stores terminal status, completion time, safe diagnostics, and safe completion summaries

### Requirement: Run events are replayable
The review orchestration layer SHALL append bounded safe lifecycle events for each generation run.

#### Scenario: Event is emitted
- **WHEN** the backend emits a review generation event
- **THEN** it appends the event with a monotonic sequence number, run id, task id, event type, status, progress, and safe payload

#### Scenario: Event history is requested
- **WHEN** a client requests stored run events
- **THEN** the backend returns ordered safe events within configured bounds

### Requirement: Orchestration state is worker-replaceable
The persisted generation run contract SHALL be compatible with a future queue or Python worker updating the same run lifecycle.

#### Scenario: Future worker updates a run
- **WHEN** a worker service reports run progress, completion, degradation, or failure through the backend contract
- **THEN** the backend can map it into the same run record and event history without changing frontend loading consumers

### Requirement: Task-level generation lifecycle
The review orchestration layer SHALL expose a task-level generation lifecycle that summarizes preparation and issue generation.

#### Scenario: Pipeline is running
- **WHEN** review preparation or draft issue generation is in progress
- **THEN** the lifecycle reports a running generation run with the latest active stage metadata

#### Scenario: Pipeline is ready
- **WHEN** preparation package persistence and draft issue generation finish successfully
- **THEN** the lifecycle reports a ready generation run that can unlock the review workbench

#### Scenario: Pipeline is degraded
- **WHEN** provider-backed generation falls back safely or yields no generated candidates
- **THEN** the lifecycle reports a degraded generation run that can still unlock the review workbench

### Requirement: Safe run diagnostics
The review orchestration layer SHALL expose only safe run diagnostics.

#### Scenario: Provider failure is summarized
- **WHEN** the generation run records fallback or failure details
- **THEN** diagnostics contain only safe status/message/source fields and exclude secrets, prompts, raw provider traces, and private document URLs

### Requirement: Post-OCR review pipeline
The system SHALL represent review work after OCR as a staged pipeline that separates structure restoration, basis binding, review analysis, issue structuring, and result packaging.

#### Scenario: OCR completes and review preparation starts
- **WHEN** a document finishes OCR processing
- **THEN** the system enters a review-preparation pipeline instead of jumping directly to a ready review state

#### Scenario: OCR recovered structure drives review preparation
- **WHEN** a document finishes OCR processing and recovered structure is available
- **THEN** the review-preparation pipeline uses recovered sections and paragraphs as its stage and paragraph context source instead of fixed demo anchors

#### Scenario: Pipeline stage is visible
- **WHEN** a document is being prepared for review
- **THEN** the system can expose the current pipeline stage id, stage title, and stage progress to the detail context

### Requirement: Paragraph-level streaming progress
The system SHALL expose review progress at paragraph or section granularity while the pipeline is preparing the document for review.

#### Scenario: A paragraph is being processed
- **WHEN** the review pipeline is processing content
- **THEN** the system can report the current paragraph or section being processed together with the total scope being handled

#### Scenario: A recovered paragraph is being processed
- **WHEN** the review pipeline is processing OCR-hydrated content
- **THEN** the system reports the current recovered paragraph id, paragraph index, total paragraph count, and section label

#### Scenario: Streaming progress updates incrementally
- **WHEN** the review pipeline advances
- **THEN** the system can update outline context, document snippets, and issue summaries without waiting for the entire document to finish

### Requirement: Locked detail observation
The system SHALL allow a user to open an in-progress document and observe live pipeline progress while keeping review actions locked until the pipeline is ready.

#### Scenario: User opens an in-progress task
- **WHEN** a document is still in review preparation
- **THEN** the detail page shows the locked streaming state instead of the editable review workbench

#### Scenario: Pipeline becomes ready
- **WHEN** the pipeline finishes normalization and issue generation
- **THEN** the detail page can unlock the review workbench for user actions

### Requirement: Agent role boundaries
The system SHALL reserve explicit agent roles for document structure restoration, construction plan review, and review result packaging.

#### Scenario: Agent inventory is exposed
- **WHEN** the data assets page or orchestration layer lists agents
- **THEN** the system can show a structure-restoration agent, a construction plan review agent, and a review report generation agent as distinct roles

#### Scenario: Prompt binding is configured
- **WHEN** an authorized user configures an agent role
- **THEN** the system can associate that role with a dedicated prompt asset and schema version

### Requirement: Structure-restoration stage
The review pipeline SHALL include a structure-restoration stage that consumes OCR output before review analysis begins.

#### Scenario: OCR completes
- **WHEN** a document finishes OCR processing
- **THEN** the pipeline enters structure restoration before basis binding and review analysis

#### Scenario: Structure restoration is running
- **WHEN** the structure-restoration agent is active
- **THEN** the system can report the current paragraph or section being normalized and the progress of that recovery step

### Requirement: Hydrated structure visibility during review preparation
The system SHALL surface the recovered document structure in the review-preparation context once OCR hydration has produced sections and paragraphs.

#### Scenario: Recovered structure is available
- **WHEN** a task has a hydrated recovered structure snapshot
- **THEN** the review-preparation view can display the source format, section count, paragraph count, and current section

#### Scenario: Recovered structure is reopened
- **WHEN** a user reopens an in-progress task that already has recovered structure
- **THEN** the detail context can restore the last known section and paragraph summary without recomputing OCR

### Requirement: Generation lifecycle activity events
The review orchestration layer SHALL produce safe activity events for meaningful generation lifecycle transitions.

#### Scenario: Run starts or retries
- **WHEN** a generation run starts for the first time or after a terminal run
- **THEN** the orchestration state can record `run-started` and, when applicable, `run-retried`

#### Scenario: Stage advances
- **WHEN** the active generation stage meaningfully changes
- **THEN** the orchestration state can record a `stage-updated` activity with safe stage metadata

#### Scenario: Terminal state is reached
- **WHEN** generation becomes ready, degraded, or failed
- **THEN** the orchestration state records a terminal activity that references the current run id and safe terminal status

### Requirement: Activity events are backend-replaceable
The generation activity event contract SHALL remain compatible with future backend worker events.

#### Scenario: Backend worker event arrives
- **WHEN** a future worker emits a lifecycle event with task id, run id, event type, and safe payload
- **THEN** it can be mapped to the same activity trail contract used by the local session service
