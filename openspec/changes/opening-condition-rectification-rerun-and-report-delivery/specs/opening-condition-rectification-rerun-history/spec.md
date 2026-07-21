## ADDED Requirements

### Requirement: Workspace-scoped rerun history
The system SHALL preserve a workspace-scoped history of opening-condition pilot runs for repeated rectification review.

#### Scenario: Archived run remains as history
- **WHEN** a pilot run is archived after report generation
- **THEN** the workspace history keeps that run visible with its round identifier, created time, final state, and report summary

#### Scenario: New rectification submission creates a new run
- **WHEN** the operator uploads rectified materials after a prior run has been archived
- **THEN** the system creates a new run for the same workspace instead of overwriting the archived run

### Requirement: Controlled history disposal
The system SHALL treat formal run history as retained records and allow only controlled soft deletion for operator mistakes or test data.

#### Scenario: Operator views formal history
- **WHEN** a workspace contains archived runs
- **THEN** those runs remain viewable by default and are not removed by starting a new run

#### Scenario: Administrator soft deletes a mistaken run
- **WHEN** an authorized operator marks a run as deleted for cleanup
- **THEN** the system hides it from the default history list while preserving minimal audit metadata
