# review-session-state Specification

## Purpose

Persist draft issue generation provenance so task reopen, debugging, and future audit/report flows can understand how AI candidates entered the review session.

## Requirements

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
