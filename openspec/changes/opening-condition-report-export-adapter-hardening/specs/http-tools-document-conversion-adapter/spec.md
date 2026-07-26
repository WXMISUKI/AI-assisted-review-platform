## MODIFIED Requirements

### Requirement: HTML-to-DOCX URL export adapter
The system SHALL call the external `html2docx` capability through a backend adapter and normalize the result.

#### Scenario: Opening-condition export endpoint reports adapter failure
- **WHEN** the opening-condition DOCX export API cannot reach a configured adapter or the adapter is not configured
- **THEN** the backend returns a bounded `export_failed` response with adapter-specific status, safe diagnostics, and an HTML fallback hint
- **AND** it does not expose raw HTML, private URLs, request headers, credentials, or stack traces
