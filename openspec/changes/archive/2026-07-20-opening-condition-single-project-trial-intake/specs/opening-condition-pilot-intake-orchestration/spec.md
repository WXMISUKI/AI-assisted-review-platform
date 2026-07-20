## MODIFIED Requirements

### Requirement: Pilot intake initialization API
The system SHALL expose a domain-owned intake/init API and a higher-level trial bootstrap wrapper that initialize an opening-condition pilot task from workspace context and uploaded object references without duplicating file-upload endpoints.

#### Scenario: Intake initializes a new pilot task
- **WHEN** the frontend submits workspace context, checklist object reference, and material packet object references for a new pilot task
- **THEN** the system creates or updates the pilot task, binds packet references, derives readiness, and returns a structured intake result

#### Scenario: Intake reuses existing task id
- **WHEN** the frontend submits intake/init for an existing pilot task id
- **THEN** the system updates the same task instead of creating a duplicate task record

#### Scenario: Upload channel remains separate
- **WHEN** opening-condition pilot intake or trial bootstrap runs
- **THEN** the system accepts previously uploaded safe object references rather than handling multipart file bytes directly
