## MODIFIED Requirements

### Requirement: Current runnable run discovery
The pilot operational API SHALL allow the frontend to discover the current runnable task for a workspace without mutating archived tasks, and SHALL expose sufficient run history metadata for repeatable rectification review.

#### Scenario: Multiple runs exist in a workspace
- **WHEN** the frontend requests the pilot task list for a workspace
- **THEN** the response includes task state, workspace context, timestamps, and report availability sufficient to select the latest runnable run and render archived history

#### Scenario: Archived task rejects formal matching
- **WHEN** a formal-match request targets an archived task
- **THEN** the API returns a safe `invalid_state` response and does not mutate the archived task

### Requirement: Report package diagnostics contract
The report API SHALL include bounded package diagnostics in generated report assets and SHALL support findings-oriented delivery fields.

#### Scenario: Report response includes findings delivery
- **WHEN** report generation succeeds for a real trial task
- **THEN** the response contains report asset diagnostics covering input object filenames, checklist/evidence/human-review counts, provider readiness, blocking reasons, disclaimer, and structured finding summaries

#### Scenario: Archived task rejects report regeneration
- **WHEN** a report-generation request targets an archived task
- **THEN** the API rejects the mutation and preserves the archived report package
