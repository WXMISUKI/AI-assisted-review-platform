# local-development-runtime Specification

## Purpose

Provide a lightweight development persistence adapter for backend review task snapshots without committing to production database infrastructure in this slice.

## Requirements

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
