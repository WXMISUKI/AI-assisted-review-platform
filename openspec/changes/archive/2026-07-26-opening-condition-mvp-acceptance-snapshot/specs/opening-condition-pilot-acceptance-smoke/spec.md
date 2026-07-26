## ADDED Requirements

### Requirement: Smoke verifies MVP acceptance snapshot
The opening-condition pilot acceptance smoke SHALL verify that the backend acceptance snapshot follows the report, export, and archive lifecycle.

#### Scenario: Report-ready snapshot
- **WHEN** the smoke generates a report after human review is closed
- **THEN** the report diagnostics include an acceptance snapshot with completed intake, match, human-review, and report steps
- **AND** the archive step remains pending

#### Scenario: Archived snapshot
- **WHEN** the smoke archives the same task
- **THEN** the acceptance snapshot marks the archive step complete
- **AND** the overall snapshot is completed and read-only
