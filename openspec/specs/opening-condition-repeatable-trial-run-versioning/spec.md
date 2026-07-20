# opening-condition-repeatable-trial-run-versioning Specification

## Purpose
Define repeatable same-workspace real-sample trial runs while preserving archived opening-condition pilot task immutability.

## Requirements
### Requirement: Repeatable trial run identity
The system SHALL support repeated real-file opening-condition trial runs in the same workspace without mutating archived tasks.

#### Scenario: Archived run remains immutable
- **WHEN** a pilot task is archived
- **THEN** subsequent intake or bootstrap using that same task id is rejected without changing the archived task

#### Scenario: Next real upload creates a new run
- **WHEN** the operator uploads basis, checklist, and material ZIP files while the current workspace pilot task is archived
- **THEN** the portal submits a new run-specific task id for bootstrap and treats the returned task as the current run

#### Scenario: Follow-on actions use current run
- **WHEN** a real-file bootstrap returns a run-specific task
- **THEN** refresh, formal matching, human review, report generation, and archive actions target that current run id until the operator changes workspace or another bootstrap completes
