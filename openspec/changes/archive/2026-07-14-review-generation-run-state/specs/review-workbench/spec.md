# review-workbench Specification

## Purpose

Use the task-level generation run snapshot to make loading, reopen, and workbench unlock behavior explicit.

## Requirements

### Requirement: Workbench unlock follows generation run state
The review workbench SHALL prefer the review generation run snapshot when deciding whether a task can be edited.

#### Scenario: Run is ready
- **WHEN** a task has a ready generation run snapshot
- **THEN** the workbench can open with editable issue decisions

#### Scenario: Run is degraded
- **WHEN** a task has a degraded generation run snapshot with reviewable document state
- **THEN** the workbench can open while preserving safe degraded context

#### Scenario: Run is running
- **WHEN** a task has a running generation run snapshot
- **THEN** the detail page remains in locked loading or observation mode

### Requirement: Legacy tasks remain openable
The workbench SHALL preserve existing task-status fallback behavior for tasks that do not yet have a generation run snapshot.

#### Scenario: Snapshot is absent
- **WHEN** an older task has no review generation run snapshot
- **THEN** the workbench uses the existing task status, preparation package, and issue state behavior without blocking entry
