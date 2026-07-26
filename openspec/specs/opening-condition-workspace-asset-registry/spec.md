# opening-condition-workspace-asset-registry Specification

## Purpose
Expose operator-facing workspace asset ownership, readiness, and run-history isolation before users switch into a new opening-condition context.

## Requirements
### Requirement: Workspace asset registry summary
The system SHALL derive an operator-facing asset registry summary for each opening-condition workspace context.

#### Scenario: Overview loads registry summaries
- **WHEN** the workspace overview loads project and workspace metadata
- **THEN** each selectable workspace context includes a summary of bound basis ownership, master-data readiness, knowledge-base readiness, and run-history presence

#### Scenario: Neighboring workspaces share a project
- **WHEN** two or more workspaces belong to the same project or review object
- **THEN** the registry summary distinguishes shared project grouping from workspace-scoped assets such as participating entity, run history, and organization-scoped knowledge base

#### Scenario: Overview loads backend-owned registry summary
- **WHEN** the opening-condition overview renders workspace candidates
- **THEN** it can consume a backend-owned workspace asset registry summary
- **AND** the summary includes bounded basis ownership, master-data readiness, knowledge-base readiness, run-history presence, and current-run binding explanation

### Requirement: Registry-aware context switching
The system SHALL make workspace switching decisions visible through asset-aware records rather than names alone.

#### Scenario: Operator reviews candidate workspace rows
- **WHEN** the overview lists review objects and participating entities
- **THEN** each row shows the workspace contract package, asset readiness snapshot, and latest run/history presence before the operator switches

#### Scenario: Selected workspace is highlighted
- **WHEN** the current workspace is rendered in the registry
- **THEN** the overview identifies it as the active asset context and explains that subsequent intake, review, and report pages operate only on that context

#### Scenario: Operator reviews candidate workspace rows
- **WHEN** the overview lists workspace rows for context switching
- **THEN** each row shows backend-derived asset readiness and latest run/history presence
- **AND** the frontend does not rely only on page-local mock-packet aggregation to explain current workspace assets
