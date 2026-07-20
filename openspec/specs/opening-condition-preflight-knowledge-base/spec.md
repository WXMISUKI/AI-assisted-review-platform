# opening-condition-preflight-knowledge-base Specification

## Purpose
Define the opening-condition preflight gates and subcontract-team knowledge-base support required before a formal single-project material review can run.
## Requirements
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

### Requirement: External knowledge-base provider binding
Opening-condition subcontract-team knowledge-base records SHALL support external RAG provider references while preserving platform-owned preflight facts.

#### Scenario: External dataset is bound
- **WHEN** a knowledge base is linked to RAGFlow or another external RAG provider
- **THEN** the platform stores provider name, provider dataset ids, optional provider document or chunk refs, and safe sync status on the platform knowledge-base record

#### Scenario: External provider is not ready
- **WHEN** the bound provider dataset is missing, stale, parsing, degraded, or unreachable
- **THEN** the readiness summary reports the knowledge-base support source as provisional or blocked according to workflow policy

#### Scenario: Knowledge-base retrieval supports material review
- **WHEN** formal material review uses external RAG recall
- **THEN** the system treats retrieved chunks as supporting evidence recall and still evaluates formal conclusions against published basis, published or human-approved master data, platform evidence, and human decisions

### Requirement: Knowledge-base operational records
The system SHALL manage subcontract-team knowledge-base records as platform-owned operational records for the opening-condition pilot.

#### Scenario: Provider reference is stored as support metadata
- **WHEN** a knowledge-base record includes RAGFlow or mock provider references
- **THEN** the system stores only safe provider identifiers and sync status as support metadata

#### Scenario: Knowledge-base status affects readiness
- **WHEN** a bound knowledge base is draft, needs review, archived, stale, disabled, or unreachable
- **THEN** the readiness summary marks knowledge-base support as missing, provisional, blocked, stale, or unreachable instead of ready

### Requirement: Next-stage delivery prioritization
The system SHALL document that the near-term delivery priority is single-project pilot operability before full multi-tenant permissions, database migration, or provider-specific optimization.

#### Scenario: Planning next work
- **WHEN** maintainers choose the next opening-condition development direction
- **THEN** they can use the project documentation and specs to prioritize operational pilot closure over local optimization

### Requirement: MaxKB-backed preflight knowledge binding
Opening-condition preflight knowledge-base records SHALL support MaxKB project-level knowledge bindings as external support metadata.

#### Scenario: Project-level MaxKB knowledge base is bound
- **WHEN** a preflight workspace or subcontract-team knowledge base is linked to a MaxKB project knowledge base
- **THEN** the platform stores provider refs and metadata that bind the MaxKB knowledge id to platform workspace, project, contract package, organization, subcontract team, and review task context

#### Scenario: MaxKB sync status affects readiness
- **WHEN** a bound MaxKB provider ref is provisional, stale, unreachable, or disabled
- **THEN** the opening-condition readiness summary marks the knowledge-base support source as provisional or blocked instead of ready

#### Scenario: MaxKB retrieval supports review only
- **WHEN** MaxKB retrieval or retrieval-check returns hits for a material review item
- **THEN** the system treats those hits as supporting evidence recall and still requires platform basis, master data, evidence records, and human decisions for formal conclusions

