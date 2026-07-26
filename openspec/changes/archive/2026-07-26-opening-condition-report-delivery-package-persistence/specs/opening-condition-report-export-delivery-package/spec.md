## ADDED Requirements

### Requirement: Backend-persisted delivery package
The opening-condition backend SHALL generate and persist the report delivery package as part of report package diagnostics.

#### Scenario: Report is generated
- **WHEN** `POST /api/opening-condition/pilot-tasks/:taskId/report` succeeds
- **THEN** the returned report asset package diagnostics include a normalized delivery package with schema version, package id, task id, status, counts, rows, next action, and safe diagnostics
- **AND** the package excludes secrets, raw prompts, raw OCR text, private URLs, and unbounded provider output

#### Scenario: Archived report is inspected
- **WHEN** a report asset is archived
- **THEN** the delivery package is refreshed or preserved with read-only state and an archived handoff status

### Requirement: Delivery package normalization
The opening-condition store SHALL normalize delivery package payloads before persistence or response.

#### Scenario: Unsafe package fields are supplied
- **WHEN** a task snapshot includes delivery package fields with extra keys, excessive text, private URLs, or invalid statuses
- **THEN** the normalized task keeps only bounded delivery package fields and drops unsafe or unknown values
 
