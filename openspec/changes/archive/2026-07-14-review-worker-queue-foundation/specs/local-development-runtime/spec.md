# local-development-runtime Specification

## Purpose

Provide a replaceable local development worker queue adapter for review-generation jobs.

## Requirements

### Requirement: File-backed development worker queue
The local development runtime SHALL support a backend-private file-backed worker queue for review-generation jobs.

#### Scenario: Backend starts locally
- **WHEN** no production queue runtime is configured
- **THEN** the backend can read and write schema-versioned queue job state from a local development data path

#### Scenario: Queue file is absent
- **WHEN** the queue data file does not exist
- **THEN** the backend treats the queue as empty and does not fail startup

### Requirement: Local worker loop is conservative
The local development runtime SHALL run a conservative in-process worker loop for review-generation jobs.

#### Scenario: Worker loop starts
- **WHEN** the backend BFF starts in local development mode
- **THEN** it can claim at most one due review-generation job at a time and execute it through the existing run store contract

#### Scenario: Backend restarts
- **WHEN** the backend restarts while a job lease was active
- **THEN** expired leases can be requeued or dead-lettered according to retry limits

### Requirement: Development queue storage is bounded and safe
The file-backed queue adapter SHALL bound job history and avoid unsafe persisted payload data.

#### Scenario: Job payload or error contains unsafe data
- **WHEN** a job summary, worker metadata, or error includes prompts, secrets, provider raw traces, private URLs, or unbounded source text
- **THEN** the adapter strips or summarizes those values before writing queue state

### Requirement: Development queue is replaceable
The file-backed queue adapter SHALL sit behind a small queue interface so Redis, PostgreSQL, or a workflow runtime can replace it later.

#### Scenario: Production queue is introduced later
- **WHEN** a production queue adapter is added
- **THEN** run creation, worker execution, run events, and frontend loading consumers can continue using the same high-level contracts
