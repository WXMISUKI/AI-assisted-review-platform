## ADDED Requirements

### Requirement: Configurable HTTP tools adapter
The system SHALL configure document conversion tool endpoints through backend environment variables.

#### Scenario: Backend starts with HTTP tools configured
- **WHEN** `HTTP_TOOLS_BASE_URL` is set
- **THEN** the backend can derive `docx2html` and `html2docx` endpoint URLs from configurable paths without hard-coding deployment IPs

#### Scenario: HTTP tools are not configured
- **WHEN** `HTTP_TOOLS_BASE_URL` is absent
- **THEN** document export operations fail safely with a bounded `not_configured` response

### Requirement: HTML-to-DOCX URL export adapter
The system SHALL call the external `html2docx` capability through a backend adapter and normalize the result.

#### Scenario: HTML-to-DOCX export succeeds
- **WHEN** the adapter posts bounded HTML, `mode=url`, and a filename to the configured `html2docx` endpoint
- **THEN** it returns success, download URL, file key, file name, file size, and safe diagnostics

#### Scenario: HTML-to-DOCX export fails
- **WHEN** the external tool returns an error or times out
- **THEN** the adapter returns a safe failure summary without exposing raw prompts, raw OCR text, credentials, private headers, or stack traces

### Requirement: DOCX-to-HTML capability reservation
The system SHALL reserve `docx2html` configuration for future original-form backfill without requiring full backfill execution in this change.

#### Scenario: Adapter status is inspected
- **WHEN** backend provider status is returned
- **THEN** the HTTP tools summary can indicate whether `docx2html` and `html2docx` paths are configured

