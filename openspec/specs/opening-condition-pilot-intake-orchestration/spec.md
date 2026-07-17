# opening-condition-pilot-intake-orchestration Specification

## Purpose
Define the domain-owned intake/init entry for the opening-condition single-project pilot so uploaded checklist and material-packet object references can initialize a formal pilot task without duplicating the generic upload channel.

## Requirements
### Requirement: Pilot intake initialization API
The system SHALL expose a domain-owned intake/init API that initializes an opening-condition pilot task from workspace context and uploaded object references without duplicating file-upload endpoints.

#### Scenario: Intake initializes a new pilot task
- **WHEN** the frontend submits workspace context, checklist object reference, and material packet object references for a new pilot task
- **THEN** the system creates or updates the pilot task, binds packet references, derives readiness, and returns a structured intake result

#### Scenario: Intake reuses existing task id
- **WHEN** the frontend submits intake/init for an existing pilot task id
- **THEN** the system updates the same task instead of creating a duplicate task record

#### Scenario: Upload channel remains separate
- **WHEN** opening-condition pilot intake runs
- **THEN** the system accepts previously uploaded safe object references rather than handling multipart file bytes directly

### Requirement: Workspace fact resolution during intake
The system SHALL resolve basis, master-data, and knowledge-base facts from platform-owned workspace records during intake orchestration.

#### Scenario: Published basis is resolved
- **WHEN** intake specifies a published basis version id or the workspace has one published basis version available
- **THEN** the system binds that published basis to the pilot task and includes safe source-object traceability if available

#### Scenario: Approved master data is resolved
- **WHEN** intake initializes the pilot task
- **THEN** the system binds approved or published workspace master-data references to the task for later authorization checks

#### Scenario: Knowledge base is auto-bound deterministically
- **WHEN** intake does not provide a knowledge-base id and the workspace has exactly one ready subcontract-team knowledge base
- **THEN** the system auto-binds that knowledge base and reports the binding outcome

#### Scenario: Knowledge base is ambiguous
- **WHEN** intake does not provide a knowledge-base id and the workspace has multiple ready knowledge-base candidates
- **THEN** the system leaves the task unbound and returns a bounded orchestration diagnostic that manual selection is required

### Requirement: Intake diagnostics and readiness result
The system SHALL return bounded orchestration diagnostics alongside task readiness after intake/init completes.

#### Scenario: Intake succeeds with blocking gates remaining
- **WHEN** packet references are accepted but basis, master-data, or knowledge-base gates are still incomplete
- **THEN** the system returns a successful intake result with readiness status and blocking reasons instead of silently running formal matching

#### Scenario: Intake input is invalid
- **WHEN** intake omits required workspace context or checklist object reference
- **THEN** the system rejects the request with a safe validation message and does not mutate the task store

### Requirement: Checklist-object derivation during intake
The system SHALL derive checklist-definition inputs during intake/init when explicit checklist-definition items are omitted.

#### Scenario: Explicit checklist definition remains allowed
- **WHEN** intake/init receives normalized checklist-definition items explicitly
- **THEN** the backend stores those items and records that checklist adaptation came from direct input

#### Scenario: Controlled template is used
- **WHEN** intake/init omits checklist-definition items and the checklist object matches a controlled template
- **THEN** the backend derives checklist-definition items from that template, stores them on the task, and reports the template resolution in intake diagnostics

#### Scenario: Existing task definition is reused
- **WHEN** intake/init omits checklist-definition items, no template is matched, and the existing task already has a checklist definition
- **THEN** the backend reuses the stored task definition and reports that fallback in intake diagnostics
