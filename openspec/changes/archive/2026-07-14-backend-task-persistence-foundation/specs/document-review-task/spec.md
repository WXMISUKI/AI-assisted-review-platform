# document-review-task Specification

## Purpose

Expose backend document review task persistence endpoints for listing, reading, and upserting review task snapshots.

## Requirements

### Requirement: Backend review task list
The backend SHALL expose a review task list endpoint.

#### Scenario: Client lists review tasks
- **WHEN** the frontend requests persisted review tasks
- **THEN** the backend returns a schema-versioned list of review task snapshots

#### Scenario: No backend tasks exist
- **WHEN** the backend store is empty
- **THEN** the backend returns an empty list without forcing the frontend to discard local fallback tasks

### Requirement: Backend review task read
The backend SHALL expose a single review task read endpoint.

#### Scenario: Client reads a task
- **WHEN** the frontend requests a task by id
- **THEN** the backend returns the matching review task snapshot if it exists

#### Scenario: Task does not exist
- **WHEN** the requested task id is absent
- **THEN** the backend returns a safe not-found response without leaking storage details

### Requirement: Backend review task upsert
The backend SHALL allow the frontend to upsert review task snapshots.

#### Scenario: Client upserts one task
- **WHEN** the frontend sends a valid review task snapshot for a task id
- **THEN** the backend stores that snapshot and returns the saved task

#### Scenario: Client bulk-syncs tasks
- **WHEN** the frontend sends a bounded list of review task snapshots
- **THEN** the backend stores the list using the development persistence adapter and returns a safe summary

### Requirement: Persisted task snapshots remain safe
The backend SHALL reject or omit unsafe task persistence fields.

#### Scenario: Unsafe fields are present
- **WHEN** a task snapshot includes credentials, tokens, raw prompts, provider traces, or private object URLs
- **THEN** the backend does not persist those unsafe values
