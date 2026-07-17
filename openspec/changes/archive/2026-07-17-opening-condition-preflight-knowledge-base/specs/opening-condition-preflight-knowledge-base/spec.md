## ADDED Requirements

### Requirement: Mandatory preflight readiness
The system SHALL require opening-condition workspaces to complete basis confirmation and project master-data initialization before formal material review can run.

#### Scenario: Workspace is ready for formal review
- **WHEN** a workspace has a published basis version, sufficient published or human-approved required master data, and a bound subcontract-team knowledge base
- **THEN** the system marks the workspace or task as ready for formal material review

#### Scenario: Basis is missing
- **WHEN** a user attempts formal material review without a published basis version
- **THEN** the system blocks formal review and explains that basis confirmation is required

#### Scenario: Required master data is missing
- **WHEN** a user attempts formal material review without required published or human-approved personnel, equipment, certificate, company, or system-document master data
- **THEN** the system blocks formal review or marks affected items as blocked with missing master-data reasons

### Requirement: Subcontract-team knowledge base
The system SHALL support an organization-scoped and subcontract-team-scoped knowledge base for reusable opening-condition material verification.

#### Scenario: Knowledge base is bound to workspace
- **WHEN** a workspace selects a participating organization and contract package
- **THEN** the system can bind a subcontract-team knowledge base containing reusable material templates, historical evidence summaries, artificial-intelligence extraction notes, and human correction records

#### Scenario: Knowledge base supports review
- **WHEN** formal material review evaluates checklist items
- **THEN** the system may use the bound knowledge base for retrieval and evidence support while preserving basis, master data, evidence, and human decisions as the source of truth

#### Scenario: Knowledge base is missing
- **WHEN** a formal review task has no bound subcontract-team knowledge base
- **THEN** the system reports the missing support source in readiness summary and keeps formal review provisional or blocked according to workflow policy

### Requirement: Readiness summary
The system SHALL expose a bounded readiness summary for each opening-condition workspace or pilot task.

#### Scenario: Readiness is displayed
- **WHEN** a user opens an opening-condition workspace or pilot task
- **THEN** the system displays basis readiness, master-data readiness, knowledge-base readiness, material-packet readiness, and blocking reasons

#### Scenario: Readiness changes
- **WHEN** a basis version is published, master data is approved, or a knowledge base is bound
- **THEN** the readiness summary updates without requiring the user to recreate the workspace
