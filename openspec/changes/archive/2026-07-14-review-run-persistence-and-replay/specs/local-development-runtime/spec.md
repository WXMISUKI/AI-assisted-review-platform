# local-development-runtime Specification

## Purpose

Provide a replaceable local development persistence adapter for review generation run records and replayable events.

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
