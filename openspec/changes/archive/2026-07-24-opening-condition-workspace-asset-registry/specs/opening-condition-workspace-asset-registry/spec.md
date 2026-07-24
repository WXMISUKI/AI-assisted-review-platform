## ADDED Requirements

### Requirement: Workspace asset registry summary
The system SHALL derive an operator-facing asset registry summary for each opening-condition workspace context.

#### Scenario: Overview loads registry summaries
- **WHEN** the workspace overview loads project and workspace metadata
- **THEN** each selectable workspace context includes a summary of bound basis ownership, master-data readiness, knowledge-base readiness, and run-history presence

#### Scenario: Neighboring workspaces share a project
- **WHEN** two or more workspaces belong to the same project or review object
- **THEN** the registry summary distinguishes shared project grouping from workspace-scoped assets such as participating entity, run history, and organization-scoped knowledge base

### Requirement: Registry-aware context switching
The system SHALL make workspace switching decisions visible through asset-aware records rather than names alone.

#### Scenario: Operator reviews candidate workspace rows
- **WHEN** the overview lists review objects and participating entities
- **THEN** each row shows the workspace contract package, asset readiness snapshot, and latest run/history presence before the operator switches

#### Scenario: Selected workspace is highlighted
- **WHEN** the current workspace is rendered in the registry
- **THEN** the overview identifies it as the active asset context and explains that subsequent intake, review, and report pages operate only on that context
