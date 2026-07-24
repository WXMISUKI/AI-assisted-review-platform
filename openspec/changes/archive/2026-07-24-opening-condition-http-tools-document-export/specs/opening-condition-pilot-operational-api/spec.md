## ADDED Requirements

### Requirement: Report document export API
The pilot operational API SHALL expose a backend-owned report DOCX export endpoint for opening-condition report assets.

#### Scenario: Frontend requests DOCX export
- **WHEN** a pilot task has a generated report asset
- **THEN** the frontend can call a typed backend endpoint to generate a DOCX report through the configured HTTP tools adapter
- **AND** the response includes the normalized export result and refreshed task/report asset when export succeeds

#### Scenario: Archived run is exported
- **WHEN** the selected run is archived and has a report asset
- **THEN** the export endpoint can generate a document from the archived report facts without mutating checklist findings, human-review decisions, or archive state

#### Scenario: Report export fails safely
- **WHEN** the adapter is not configured, times out, or rejects the input
- **THEN** the API returns a safe error payload and does not expose raw HTML, raw provider output, credentials, or private URLs

