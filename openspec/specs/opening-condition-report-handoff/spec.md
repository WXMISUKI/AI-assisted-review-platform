# opening-condition-report-handoff Specification

## Purpose
Define how opening-condition review tasks expose report availability, archive state, and report-detail entry from MVP task rows.

## Requirements

### Requirement: Report access from task rows
The opening-condition task workbench SHALL expose report availability and archive state from each review task row.

#### Scenario: Report is ready
- **WHEN** a task has a ready report asset
- **THEN** the task row shows the report as ready and routes the operator to the report page for detail, export, or archive

#### Scenario: Task is archived
- **WHEN** a task is archived
- **THEN** the task row marks it as historical read-only and keeps report access visible

### Requirement: Export-ready report handoff fields
The opening-condition report handoff SHALL keep the fields needed for later DOCX or original-table export visible in the page-level delivery list.

#### Scenario: Operator reviews a delivery list row
- **WHEN** a finding row is rendered in the report delivery list
- **THEN** the row exposes the check item title, issue description, risk level, basis, rectification requirement, and available evidence or human-review notes

#### Scenario: Finding lacks enriched basis
- **WHEN** a finding does not yet have enriched legal-basis text
- **THEN** the row still shows the best available platform basis or a clear missing-basis placeholder
