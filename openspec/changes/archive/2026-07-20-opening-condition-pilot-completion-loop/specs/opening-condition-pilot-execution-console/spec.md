## ADDED Requirements

### Requirement: Pilot completion loop actions
The opening-condition pilot execution console SHALL expose backend-backed human-review decision, report generation, and archive actions after formal matching has produced task-owned results.

#### Scenario: Human review blockers are displayed
- **WHEN** a backend pilot task has human-review queue items
- **THEN** the portal displays those task-owned items ahead of local demo review items and provides bounded decision actions for open or deferred items

#### Scenario: Operator decides a human review item
- **WHEN** the operator confirms, corrects, rejects, or defers a backend human-review item
- **THEN** the portal calls the backend decision API, refreshes the pilot task, and displays the updated blocking count or task state

#### Scenario: Operator generates report
- **WHEN** the backend pilot task has no blocking human-review items and is in a report-ready state
- **THEN** the portal allows the operator to generate a backend report asset and renders that asset as the primary report summary

#### Scenario: Operator archives report
- **WHEN** the backend pilot task has a ready report asset
- **THEN** the portal allows the operator to archive the task and shows the archived task state without mutating local demo packet data

### Requirement: Backend-backed execution result rendering
The opening-condition review page SHALL prefer backend pilot-task check items and evidence over local demo packet results whenever a pilot task exists.

#### Scenario: Backend check items are present
- **WHEN** the pilot task contains check items from formal matching
- **THEN** the review page renders those items as the primary material-check list with evidence and human-review references

#### Scenario: Backend evidence is present
- **WHEN** the pilot task contains evidence records from formal matching
- **THEN** the review page renders task-owned evidence records as the primary traceability list

#### Scenario: Backend task has no results yet
- **WHEN** the pilot task exists but has no check items or evidence
- **THEN** the review page may still display local demo packet content as fallback context while preserving explicit backend execution actions
