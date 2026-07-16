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

