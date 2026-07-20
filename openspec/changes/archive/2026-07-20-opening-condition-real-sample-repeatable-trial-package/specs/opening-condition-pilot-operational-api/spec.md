## ADDED Requirements

### Requirement: Trial package operational contract
The pilot operational API SHALL return bounded trial package summary fields on task, intake, match, report, and archive responses when available.

#### Scenario: Task payload includes trial package
- **WHEN** the frontend fetches a pilot task after real intake
- **THEN** the response includes trial package summary fields without exposing secrets, raw OCR text, raw prompts, private URLs, or unbounded document text

#### Scenario: Mutations refresh trial package
- **WHEN** intake, matching, human-review decision, report generation, or archive mutation succeeds
- **THEN** the returned task contains an updated trial package summary consistent with the new task state

### Requirement: Report package diagnostics contract
The report API SHALL include bounded package diagnostics in generated report assets.

#### Scenario: Report response includes package diagnostics
- **WHEN** report generation succeeds for a real trial task
- **THEN** the response contains report asset diagnostics covering input object filenames, checklist/evidence/human-review counts, provider readiness, blocking reasons, and disclaimer

#### Scenario: Archived task rejects report regeneration
- **WHEN** a report-generation request targets an archived task
- **THEN** the API returns a safe `invalid_state` response and does not mutate the task
