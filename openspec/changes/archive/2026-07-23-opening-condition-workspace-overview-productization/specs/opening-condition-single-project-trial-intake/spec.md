## MODIFIED Requirements

### Requirement: Trial intake workspace placement
The system SHALL place real single-project trial intake controls inside the opening-condition "资料接入" workflow page.

#### Scenario: Operator opens opening-condition overview
- **WHEN** the operator enters the opening-condition workspace overview
- **THEN** the system shows a concise project/task status summary without exposing all upload, readiness, matching, and report controls together

#### Scenario: Overview routes to material intake
- **WHEN** the operator needs to upload files, initialize a new run, or continue intake
- **THEN** the overview provides a clear route to the "资料接入" page rather than duplicating intake controls

#### Scenario: Operator opens material intake
- **WHEN** the operator selects the "资料接入" page
- **THEN** the system shows the basis, checklist, ZIP/material packet upload bootstrap, readiness, knowledge-base binding, and formal matching controls needed for the current pilot

#### Scenario: Operator uploads a ZIP package
- **WHEN** the operator selects a ZIP material packet during trial bootstrap
- **THEN** the system uses the existing upload channel and passes safe object references into the pilot bootstrap API rather than sending server-local paths or browser secrets
