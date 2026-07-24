## ADDED Requirements

### Requirement: Export handoff stores adapter result
The opening-condition export handoff SHALL capture normalized document export results from the HTTP tools adapter.

#### Scenario: Report DOCX export succeeds
- **WHEN** a report export operation returns a `downloadUrl`
- **THEN** the task report asset exposes an updated export handoff with `exported` status, generated object summary, file key, file name, file size, and safe diagnostics

#### Scenario: Report DOCX export cannot run
- **WHEN** the adapter is not configured or the report asset is missing
- **THEN** the export handoff remains inspectable and the API returns a bounded failure status and next action

