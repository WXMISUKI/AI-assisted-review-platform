# review-workbench Specification

## Purpose

Keep document library, loading, workbench, and result preview behavior stable while review task state begins loading from backend persistence.

## Requirements

### Requirement: Workbench can reopen backend-persisted tasks
The review workbench SHALL open tasks loaded from backend persistence the same way it opens locally persisted tasks.

#### Scenario: Backend task is ready
- **WHEN** a backend-loaded task has ready or degraded review generation state and reviewable issues
- **THEN** the workbench opens with the same document content, issue decisions, activity summaries, and result entry behavior as local tasks

#### Scenario: Backend task is still running
- **WHEN** a backend-loaded task has running review generation state
- **THEN** the detail entry stays in locked loading/observation mode

### Requirement: Local fallback remains visible
The document library SHALL keep local fallback tasks available when backend persistence is empty or unavailable.

#### Scenario: Backend is empty
- **WHEN** backend task persistence returns an empty list and localStorage has existing tasks
- **THEN** the document library can keep showing local tasks instead of replacing them with an empty state

#### Scenario: Backend is unavailable
- **WHEN** backend persistence cannot be reached
- **THEN** the document library and workbench continue using existing localStorage/seed behavior

### Requirement: User-facing behavior remains unchanged
The persistence migration SHALL not change review decisions, retry, loading, issue handling, or result preview behavior.

#### Scenario: User reviews a task
- **WHEN** task state is loaded from backend persistence
- **THEN** accept, reject, edit, manual annotation, retry, completion, and result preview flows remain unchanged
