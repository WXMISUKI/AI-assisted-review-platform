## ADDED Requirements

### Requirement: Construction-plan report export endpoint
The document review task SHALL expose a task-scoped DOCX report export endpoint for completed construction-plan supervisor reports.

#### Scenario: Completed task has exportable report
- **WHEN** a completed review task contains `resultAsset.type = supervisor-report`
- **THEN** `POST /api/review-tasks/:taskId/report/export-docx` returns a bounded export result with download metadata when conversion succeeds

#### Scenario: Completed task has no exportable report
- **WHEN** the task has no result asset or its result asset is not a `supervisor-report`
- **THEN** the endpoint returns a safe `missing_report` failure instead of exporting an invalid artifact

#### Scenario: Conversion adapter is unavailable
- **WHEN** the backend cannot run the HTML-to-DOCX adapter
- **THEN** the endpoint returns a safe `export_failed` response with bounded diagnostics and fallback guidance
