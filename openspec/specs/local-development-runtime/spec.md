# local-development-runtime Specification

## Purpose
TBD - created by archiving change dev-command-starts-frontend-and-backend. Update Purpose after archive.
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

### Requirement: File-backed development generation run store
The local development runtime SHALL support a backend-private file-backed adapter for review generation runs and event history.

#### Scenario: Backend starts locally
- **WHEN** no production queue or database is configured
- **THEN** the backend can read and write schema-versioned generation run state from a local development data path

#### Scenario: Local run data is absent
- **WHEN** the local run data file does not exist
- **THEN** the backend treats the run store as empty and does not fail startup

### Requirement: Development run store is bounded
The file-backed run store SHALL bound stored runs and events to keep local development data manageable.

#### Scenario: Too many runs or events exist
- **WHEN** the store exceeds configured run or event limits
- **THEN** old or expired records can be pruned without affecting current active runs

### Requirement: Development run store is replaceable
The file-backed run store SHALL sit behind a small interface so a production queue and database can replace it later.

#### Scenario: Queue-backed execution is introduced later
- **WHEN** Redis, PostgreSQL, or a Python worker updates generation run state
- **THEN** frontend consumers can continue using the same run status, event history, and replayable stream contract

### Requirement: Local run persistence avoids unsafe data
The development adapter SHALL not persist secrets, prompts, raw provider traces, private URLs, or unbounded source text.

#### Scenario: Run payload contains unsafe values
- **WHEN** a generation run input, event, diagnostic, or completion payload includes unsafe data
- **THEN** the adapter strips or summarizes that data before writing local run state

### Requirement: File-backed development review task store
The local development runtime SHALL support a backend-private file-backed adapter for review task snapshots.

#### Scenario: Backend starts in local development
- **WHEN** the backend needs review task persistence and no production database is configured
- **THEN** it can read and write a schema-versioned JSON snapshot from a local development data path

#### Scenario: Local data file is absent
- **WHEN** the local data file does not exist
- **THEN** the backend treats the store as empty and does not fail startup

### Requirement: Development adapter is replaceable
The file-backed adapter SHALL sit behind a small store interface so PostgreSQL can replace it later.

#### Scenario: Production persistence is introduced later
- **WHEN** a PostgreSQL adapter is added
- **THEN** frontend page-level callers do not need to change because they consume the same backend task persistence contract

### Requirement: Local persistence avoids unsafe data
The development adapter SHALL not persist secrets or private transient URLs.

#### Scenario: Task snapshot contains unsafe values
- **WHEN** a snapshot includes credentials, tokens, raw prompts, provider traces, or private presigned URLs
- **THEN** the adapter rejects or strips those values before writing local data

### Requirement: Full-stack local dev command
The project SHALL provide a default local development command that starts both the frontend and backend required by proxied API workflows.

#### Scenario: Developer starts the platform
- **WHEN** a developer runs `pnpm dev`
- **THEN** the backend BFF listens on the configured backend port and the Vite frontend starts with `/api` proxy support

### Requirement: Split local dev commands
The project SHALL keep separate frontend-only and backend-only commands for focused debugging.

#### Scenario: Developer starts only the frontend
- **WHEN** a developer runs the frontend-only command
- **THEN** only the Vite frontend starts and proxied API calls still require a separately running backend

#### Scenario: Developer starts only the backend
- **WHEN** a developer runs the backend-only command
- **THEN** only the local backend BFF starts

### Requirement: Local runtime supports agent-service fallback
The local development runtime SHALL remain usable without a configured Python agent service.

#### Scenario: Developer starts only the Node backend
- **WHEN** no agent service configuration is present
- **THEN** review generation jobs continue through local fallback and connectivity reports the fallback source

#### Scenario: Developer configures an agent service
- **WHEN** an agent service base configuration is present
- **THEN** the Node worker can attempt delegated execution within configured timeout bounds

### Requirement: Agent bridge configuration is server-only
The local development runtime SHALL keep agent bridge configuration on the backend side.

#### Scenario: Frontend reads connectivity
- **WHEN** the frontend requests backend readiness
- **THEN** it receives safe readiness fields without raw service URLs, auth values, or headers

