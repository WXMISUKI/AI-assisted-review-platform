## ADDED Requirements

### Requirement: Report access from task rows
The opening-condition task workbench SHALL expose report availability and archive state from each review task row.

#### Scenario: Report is ready
- **WHEN** a task has a ready report asset
- **THEN** the task row shows the report as ready and routes the operator to the report page for detail, export, or archive

#### Scenario: Task is archived
- **WHEN** a task is archived
- **THEN** the task row marks it as historical read-only and keeps report access visible
