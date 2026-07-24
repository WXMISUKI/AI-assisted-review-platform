# dual-portal-mvp-boundaries Specification

## Purpose
TBD - created by archiving change dual-portal-mvp-boundaries-and-code-governance. Update Purpose after archive.
## Requirements
### Requirement: Independent product MVP contracts
The platform SHALL define construction-plan review and opening-condition review as independently testable product contracts under one shared platform shell.

#### Scenario: Construction-plan MVP boundary
- **WHEN** a construction-plan review task is created
- **THEN** its minimum flow SHALL cover document intake, OCR/preparation, AI or manual issue handling, completion, and a result asset
- **AND** it SHALL NOT require opening-condition basis, master-data, packet, or run state

#### Scenario: Opening-condition MVP boundary
- **WHEN** an opening-condition review run is created
- **THEN** its minimum flow SHALL cover workspace context, published basis/master-data preflight, packet/checklist matching, human review, report generation, archive, and rerun history
- **AND** it SHALL NOT require construction-plan document issue state

### Requirement: Shared service reuse
Both products SHALL reuse shared platform services only through explicit contracts for shell, themes, object references, provider readiness, report handoff, and bounded activity records.

#### Scenario: Shared upload or provider call
- **WHEN** either product uploads a document or calls OCR/provider infrastructure
- **THEN** it SHALL use the shared adapter boundary
- **AND** product-specific metadata SHALL remain in the owning product domain

### Requirement: Parallel test isolation
Each product SHALL expose an independent acceptance checklist and test entry point.

#### Scenario: Product-specific regression
- **WHEN** a construction-plan change is verified
- **THEN** construction-plan tests SHALL be runnable without initializing an opening-condition workspace
- **AND** opening-condition smoke tests SHALL remain runnable without construction-plan fixtures

