# review-agent-orchestration Specification

## Purpose

Introduce a backend worker queue boundary for review generation runs so execution can later move from the Node BFF to a production queue and Python worker service.

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
