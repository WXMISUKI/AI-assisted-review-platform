# opening-condition-pilot-execution-console Specification

## Purpose
Define the operator-facing execution console for the opening-condition pilot so trial users can explicitly initialize intake, run formal checklist matching, and inspect blocking reasons without hidden auto-execution.

## Requirements
### Requirement: Explicit pilot execution actions
The system SHALL expose explicit operator actions for pilot intake/init, formal matching, and state refresh in the opening-condition review portal.

#### Scenario: Operator initializes pilot intake
- **WHEN** the pilot task is not yet packet-ready or the operator wants to reinitialize the task
- **THEN** the portal allows an explicit intake/init action and displays the resulting readiness summary

#### Scenario: Operator starts formal matching
- **WHEN** the pilot task has a packet-bound task context and the operator chooses to run formal matching
- **THEN** the portal triggers backend checklist matching explicitly instead of doing so automatically during workspace sync

#### Scenario: Operator refreshes execution state
- **WHEN** the operator requests refresh
- **THEN** the portal reloads current task state and readiness without mutating the task

### Requirement: Backend-first execution rendering
The system SHALL prefer backend pilot-task execution data over local mock packet summaries whenever a pilot task exists.

#### Scenario: Task-backed check items exist
- **WHEN** backend pilot task check items, evidence, human-review queue, or report asset are present
- **THEN** the portal renders those backend-backed results as the primary execution view

#### Scenario: Backend task is unavailable
- **WHEN** no backend pilot task is found or the backend is unavailable
- **THEN** the portal may fall back to the local demo packet while clearly preserving the ability to initialize a real pilot task
