## MODIFIED Requirements

### Requirement: Workspace asset registry summary
The system SHALL expose an operator-facing workspace asset registry summary through a backend-owned operational contract.

#### Scenario: Overview loads registry summaries
- **WHEN** the opening-condition overview loads workspace candidates
- **THEN** the frontend can request workspace asset summaries from a typed backend contract
- **AND** each summary includes bounded basis ownership, master-data readiness, knowledge-base readiness, run-history presence, and current-run binding explanation

#### Scenario: Neighboring workspaces share a project
- **WHEN** two or more workspaces belong to the same project or review object
- **THEN** the registry summary distinguishes shared project grouping from workspace-scoped assets such as participant entity, latest runnable run, archived history, and organization-scoped knowledge-base binding

### Requirement: Registry-aware context switching
The system SHALL make workspace switching decisions visible through backend-derived asset-aware records rather than names alone.

#### Scenario: Operator reviews candidate workspace rows
- **WHEN** the overview lists review objects and participating entities
- **THEN** each row shows the workspace contract package, asset readiness snapshot, and latest run/history presence from the backend-owned registry summary
- **AND** the frontend does not rely only on page-local mock-packet aggregation to explain the current workspace assets
