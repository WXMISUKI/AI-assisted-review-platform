## MODIFIED Requirements

### Requirement: Review kernel basis catalog
The system SHALL define the construction plan review kernel around versioned normative and project-specific basis sources, and SHALL allow deterministic issue-draft generation from recovered structure to reuse those basis categories.

#### Scenario: Kernel basis is prepared
- **WHEN** a construction plan review task is started
- **THEN** the review kernel can identify configured basis categories including JT/T 1495-2024, JTG F90-2015, JTG G10-2016, current laws, mandatory standards, local requirements,危大工程 requirements, tender documents, bid commitments, contracts,施工组织设计, drawings, and safety risk assessment reports

#### Scenario: Structure-driven draft issue is created
- **WHEN** recovered structure contains a paragraph that matches a common review-risk pattern
- **THEN** the kernel can produce a deterministic draft issue with a stable anchor, basis category, and check domain

### Requirement: Traceable conclusion contract
Every kernel conclusion SHALL be traceable to document location and review basis.

#### Scenario: Finding is generated
- **WHEN** the kernel emits a finding
- **THEN** the finding includes the source document anchor, the basis reference, the check domain, the判定标准, and the recommended verification method

#### Scenario: Draft issue is generated from recovered structure
- **WHEN** a deterministic draft issue is generated from OCR-hydrated content
- **THEN** the finding still includes a stable document anchor and basis reference rather than a free-form placeholder
