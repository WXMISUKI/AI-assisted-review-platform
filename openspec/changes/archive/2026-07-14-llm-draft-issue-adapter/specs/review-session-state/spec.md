# review-session-state Specification

## Purpose

Persist generated draft issue candidates through the review session boundary after review preparation completes.

## Requirements

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
