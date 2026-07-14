# local-development-runtime Specification

## Purpose
TBD - created by archiving change dev-command-starts-frontend-and-backend. Update Purpose after archive.
## Requirements
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

