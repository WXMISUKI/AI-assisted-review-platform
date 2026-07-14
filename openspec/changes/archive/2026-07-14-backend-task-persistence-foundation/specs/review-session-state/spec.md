# review-session-state Specification

## Purpose

Move the review task aggregate toward backend-owned persistence while preserving the existing frontend session service contract and fallback behavior.

## Requirements

### Requirement: Backend-owned review task snapshots
The review session state SHALL support loading and saving review task snapshots through a backend persistence contract.

#### Scenario: Backend task snapshots are available
- **WHEN** the frontend session repository loads review tasks and the backend returns persisted task snapshots
- **THEN** the session state uses those backend snapshots as the primary task source

#### Scenario: Backend task snapshots are unavailable
- **WHEN** the backend task persistence endpoint fails or is unreachable
- **THEN** the session state falls back to localStorage or seeded tasks without blocking the workbench

### Requirement: Session aggregate shape is preserved
The backend task snapshot SHALL preserve the existing review task aggregate fields used by the session service.

#### Scenario: Generated review state is persisted
- **WHEN** a task has review generation run state, activity trail, preparation package, draft issue snapshot, generated issues, OCR job, source object, failure, or result asset
- **THEN** backend persistence can store and return those fields without requiring page-level remapping

### Requirement: Save remains compatible with synchronous session service flows
The review session state SHALL keep existing synchronous session service operations usable while backend persistence is introduced.

#### Scenario: Task state is saved
- **WHEN** a session service operation mutates task state
- **THEN** local state updates immediately and backend persistence can be synchronized as a best-effort side effect in this foundation slice
