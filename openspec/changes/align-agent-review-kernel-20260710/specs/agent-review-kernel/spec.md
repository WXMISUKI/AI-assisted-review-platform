## ADDED Requirements

### Requirement: Review kernel basis catalog
The system SHALL define the construction plan review kernel around versioned normative and project-specific basis sources.

#### Scenario: Kernel basis is prepared
- **WHEN** a construction plan review task is started
- **THEN** the review kernel can identify configured basis categories including JT/T 1495-2024, JTG F90-2015, JTG G10-2016, current laws, mandatory standards, local requirements,危大工程 requirements, tender documents, bid commitments, contracts,施工组织设计, drawings, and safety risk assessment reports

#### Scenario: Project commitment priority is represented
- **WHEN** bid commitments conflict with generic tender requirements
- **THEN** the review kernel can mark the bid commitment as a higher-priority project-specific basis

### Requirement: Dual-engine review responsibilities
The system SHALL separate deterministic rule checks from LLM semantic reasoning in the review kernel contract.

#### Scenario: Deterministic compliance check runs
- **WHEN** the kernel checks statutory content completeness,危大/超危大 classification, signatures, seals, expert-group requirements, or quantitative thresholds
- **THEN** the result is represented as a rule-engine finding

#### Scenario: Semantic engineering judgment runs
- **WHEN** the kernel evaluates工艺适配性,工序逻辑, safety/quality/environment measure specificity, or整改建议
- **THEN** the result is represented as a semantic-reasoning finding

### Requirement: Check domain coverage
The review kernel SHALL classify findings by business check domain.

#### Scenario: Content completeness is checked
- **WHEN** the kernel validates JT/T 1495-2024 chapter 5 statutory preparation content
- **THEN** findings are classified under preparation-content checks

#### Scenario: Procedure compliance is checked
- **WHEN** the kernel validates construction-unit internal review, supervisor review, expert论证, or scheme-change workflows
- **THEN** findings are classified under procedure-compliance checks

#### Scenario: Professional technical checks are performed
- **WHEN** the kernel validates roadbed, bridge/culvert, tunnel, pavement, or reconstruction/extension engineering checks
- **THEN** findings are classified under professional-technical checks

### Requirement: Scenario-specific outputs
The review kernel SHALL support construction-unit self-check, supervisor formal review, and expert-review assistance outputs.

#### Scenario: Construction unit self-check output is requested
- **WHEN** the output scenario is construction-unit self-check
- **THEN** the kernel output includes missing-content items, missing-procedure items,危大/超危大 classification prompts, and technical parameter整改 references

#### Scenario: Supervisor formal review output is requested
- **WHEN** the output scenario is supervisor formal review
- **THEN** the kernel output includes overall compliance evaluation, issue traceability list, and closed-loop整改 instructions

#### Scenario: Expert-review assistance output is requested
- **WHEN** the output scenario is expert-review assistance
- **THEN** the kernel output includes论证要点, expert qualification checks, participant-compliance checks, and modification-verification points

### Requirement: Traceable conclusion contract
Every kernel conclusion SHALL be traceable to document location and review basis.

#### Scenario: Finding is generated
- **WHEN** the kernel emits a finding
- **THEN** the finding includes the source document anchor, the basis reference, the check domain, the判定标准, and the recommended verification method
