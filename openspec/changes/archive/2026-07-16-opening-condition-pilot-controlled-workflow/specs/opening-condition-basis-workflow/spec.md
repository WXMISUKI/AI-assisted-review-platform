## ADDED Requirements

### Requirement: Pilot basis persistence gate
The opening-condition pilot workflow SHALL persist basis-set versions and require a published basis version before creating or running a formal pilot task.

#### Scenario: Basis version is published for pilot use
- **WHEN** a reviewer confirms required basis components and publishes a basis-set version
- **THEN** the system records the published version id, workspace id, evidence references, publisher identity placeholder, and publication time for later task binding

#### Scenario: Pilot task starts without published basis
- **WHEN** a user attempts to create or run a formal pilot task without a published basis-set version
- **THEN** the system blocks the task and records a safe prerequisite failure event

#### Scenario: Basis is superseded after task creation
- **WHEN** a newer basis-set version is published after a pilot task has started
- **THEN** the task remains bound to its original basis-set version unless a human explicitly creates a new task or rebind action
