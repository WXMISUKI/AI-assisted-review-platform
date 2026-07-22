# opening-condition-basis-workflow Specification

## Purpose
TBD - created by archiving change separate-product-portals-and-opening-basis-workflow. Update Purpose after archive.
## Requirements
### Requirement: Versioned basis set
The opening-condition portal SHALL represent authoritative review basis as a versioned basis set.

#### Scenario: Basis set is created
- **WHEN** a user starts basis preparation in a workspace
- **THEN** the system creates a draft basis set version scoped to that workspace

#### Scenario: Basis set is published
- **WHEN** all required basis entries have been human confirmed
- **THEN** the system can publish the basis set version for use by review tasks

### Requirement: Basis components
A basis set SHALL support contracts, supplemental agreements, checklist templates, applicable regulations, project management rules, and confirmed project-specific requirements.

#### Scenario: Contract is uploaded
- **WHEN** a user uploads a contract or supplemental agreement as basis material
- **THEN** the system records it as a basis component candidate with source file evidence

#### Scenario: Checklist template is uploaded
- **WHEN** a user uploads an opening-condition checklist template or filled checklist
- **THEN** the system records its version or extracted checklist identity as a basis component candidate

### Requirement: Provisional AI extraction
OCR and AI extraction SHALL create provisional basis candidates rather than immediately publishing authoritative basis records.

#### Scenario: AI extracts basis fields
- **WHEN** OCR or AI extracts contract sections, requirement clauses, dates, parties, or applicability labels
- **THEN** the extracted values are stored as provisional candidates with confidence and evidence references

#### Scenario: Low confidence extraction occurs
- **WHEN** extracted basis information is incomplete, conflicting, expired, or low-confidence
- **THEN** the basis component is marked as requiring human review before publication

### Requirement: Human basis confirmation
A basis set SHALL require human confirmation before it can be bound to a formal opening-condition review task.

#### Scenario: Human confirms basis entry
- **WHEN** a reviewer confirms or corrects a provisional basis entry
- **THEN** the system records the confirmed value, reviewer identity placeholder, confirmation time, evidence, and optional score or note

#### Scenario: Review starts without published basis
- **WHEN** a user attempts to start a formal check task without a published basis set
- **THEN** the system blocks formal task creation and explains that basis publication is required

### Requirement: Review task basis binding
Every formal opening-condition review task SHALL bind to one published basis-set version.

#### Scenario: Task is created
- **WHEN** a user creates a formal opening-condition review task
- **THEN** the task records the published basis-set version id it uses

#### Scenario: Basis changes later
- **WHEN** a newer basis-set version is published after a task is created
- **THEN** the existing task remains bound to its original basis-set version unless explicitly re-opened or re-created

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

### Requirement: Basis publication queue visibility
The opening-condition portal SHALL distinguish basis records waiting for confirmation, waiting for publication, already published, and no-longer-active records.

#### Scenario: Operator reviews basis publication readiness
- **WHEN** basis records exist for the selected workspace
- **THEN** the portal groups them into pending confirmation, publish-ready, published, and exception states
- **AND** each group uses operator-facing labels instead of raw status enums

### Requirement: Current run basis snapshot visibility
The opening-condition portal SHALL show which basis version the current run is currently bound to.

#### Scenario: Operator verifies bound basis version
- **WHEN** a pilot run is selected
- **THEN** the basis-and-master-data page highlights the run-bound basis version separately from the overall published basis catalog

### Requirement: Basis publish note before formal intake
The opening-condition portal SHALL allow the operator to add a safe note before publishing the current-run basis candidate.

#### Scenario: Operator publishes basis with note
- **WHEN** the operator decides the current-run basis candidate is acceptable for formal use
- **THEN** the intake preview workspace allows a safe note to be captured before the basis is published

