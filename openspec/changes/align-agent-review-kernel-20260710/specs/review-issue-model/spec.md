## ADDED Requirements

### Requirement: Kernel-backed issue metadata
The system SHALL store kernel metadata on each AI review issue.

#### Scenario: AI issue is created by the review kernel
- **WHEN** a rule, semantic, or hybrid finding is converted into a review issue
- **THEN** the issue stores engine source, check domain, check item, output scenario, basis priority, and schema version

### Requirement: Structured basis references
The system SHALL represent normative and project-specific basis references as structured data rather than only free text.

#### Scenario: Issue references a standard clause
- **WHEN** an issue cites JT/T 1495-2024, JTG F90-2015, JTG G10-2016, or another normative source
- **THEN** the issue reference stores source type, source title, version, clause number, clause summary, and reference priority

#### Scenario: Issue references a project document
- **WHEN** an issue cites tender documents, bid commitments, contracts, drawings,施工组织设计, or safety risk assessment reports
- **THEN** the issue reference stores source type, document name, locator, summary, and reference priority

### Requirement: Compliance severity categories
The system SHALL distinguish statutory mandatory issues, general normative issues, and optimization suggestions.

#### Scenario: Issue severity is displayed
- **WHEN** an issue is shown to the user
- **THEN** the issue can be categorized as mandatory-clause issue, general-norm issue, or optimization suggestion in addition to its risk level

### Requirement: Rectification loop fields
The system SHALL store整改 requirement, verification standard,整改时限, and复核流程 data for findings that require closed-loop management.

#### Scenario: Supervisor formal review issue is created
- **WHEN** the issue belongs to supervisor formal review output
- **THEN** the issue includes整改要求,核验标准,整改时限, and复核流程 fields where available

### Requirement: Expert review fields
The system SHALL support expert论证 assistance metadata for applicable issues.

#### Scenario: Expert review issue is created
- **WHEN** an issue relates to超危大工程论证
- **THEN** the issue can store论证要点, expert qualification requirements, participant requirements,论证结论 handling, and modification-verification notes
