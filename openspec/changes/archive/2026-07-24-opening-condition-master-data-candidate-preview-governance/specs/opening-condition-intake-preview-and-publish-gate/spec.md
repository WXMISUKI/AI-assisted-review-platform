## ADDED Requirements

### Requirement: Intake gate explains master-data preview readiness
The current run intake preview gate SHALL explain whether run-bound master data is provisional, confirmed for current run, published, rejected, or missing.

#### Scenario: Current run has provisional master-data candidates
- **WHEN** the operator opens the material-intake page for a run with provisional required master-data records
- **THEN** the intake gate shows the candidate preview, source evidence, missing fields, confidence, and next action to confirm or reject the candidate

#### Scenario: Current run has current-run confirmed master data
- **WHEN** the current run has required master-data records with `human_approved` status
- **THEN** the intake gate marks the current run master-data gate as usable for the pilot while still distinguishing it from reusable published catalog records

#### Scenario: Current run has published master data
- **WHEN** the current run has required master-data records with `published` status
- **THEN** the intake gate marks the master-data gate as ready and keeps the reusable catalog record ids visible

### Requirement: Intake gate keeps publication debt visible
The current run intake preview gate SHALL keep reusable publication debt visible without blocking the current pilot when an explicit current-run confirmation is allowed.

#### Scenario: Current run uses human-approved records
- **WHEN** a run is allowed to proceed with `human_approved` master-data records
- **THEN** the intake gate shows that formal matching can proceed for the pilot and that reusable catalog publication remains a follow-up action
