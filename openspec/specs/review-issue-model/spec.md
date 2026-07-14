# review-issue-model Specification

## Purpose
TBD - created by archiving change interactive-review-mvp. Update Purpose after archive.
## Requirements
### Requirement: Generated issue provenance metadata
The review issue model SHALL allow AI-generated issues to reference the generation run that produced them.

#### Scenario: LLM issue is stored
- **WHEN** a validated LLM issue candidate is merged into the task
- **THEN** the issue can store generation run id, generation source, and generated timestamp

#### Scenario: Fallback issue is stored
- **WHEN** deterministic fallback produces an AI issue candidate
- **THEN** the issue can store fallback generation provenance while remaining a pending AI issue

#### Scenario: Manual issue is stored
- **WHEN** a reviewer creates a manual issue
- **THEN** the issue remains distinguishable as manual and does not require generation provenance

### Requirement: Validated AI issue candidates
The system SHALL validate AI-generated draft issue candidates before storing them as review issues.

#### Scenario: Candidate has valid anchor
- **WHEN** an AI candidate references a known paragraph and resolvable anchor text
- **THEN** the system converts it into a pending `ReviewIssue` with stable paragraph offsets

#### Scenario: Candidate anchor is invalid
- **WHEN** an AI candidate references an unknown paragraph or unresolvable anchor text
- **THEN** the system drops the candidate or returns it as invalid diagnostics rather than rendering it as a review issue

### Requirement: Candidate deduplication
The system SHALL deduplicate generated AI candidates against existing deterministic draft issues.

#### Scenario: LLM and deterministic issue overlap
- **WHEN** a generated candidate has the same title, paragraph, and anchor text as an existing draft issue
- **THEN** the system stores only one review issue for that finding

#### Scenario: Candidate adds new finding
- **WHEN** a generated candidate points to a distinct paragraph anchor and finding title
- **THEN** it can be appended as a new pending AI issue

### Requirement: Structured review issue
The system SHALL represent each AI or manual finding as a structured review issue with identity, source, severity, status, anchor, finding details, and resolution data.

#### Scenario: AI returns a review issue
- **WHEN** the application receives an AI finding
- **THEN** the finding can be represented as a review issue object without parsing free-form text

### Requirement: Stable document anchor
The system SHALL anchor each review issue to a stable document location using paragraph identity, character offsets, and the original anchor text.

#### Scenario: UI renders a highlighted range
- **WHEN** a review issue contains a paragraph anchor and character offsets
- **THEN** the UI can render the exact anchored text range inside the matching paragraph

#### Scenario: Anchor is rebound after OCR hydration
- **WHEN** the task uses a hydrated recovered structure
- **THEN** the system can rebind the issue to a recovered paragraph while preserving the original anchor text as the match source

### Requirement: Finding explanation fields
The system SHALL store the issue title, reason, basis, risk level, and suggested replacement separately.

#### Scenario: User views an issue card
- **WHEN** an issue card is displayed
- **THEN** the user can distinguish the problem summary, non-compliance reason, normative basis, severity, and AI suggestion

### Requirement: Human resolution data
The system SHALL store the user's resolution action independently from the original AI finding.

#### Scenario: User accepts or rejects an issue
- **WHEN** the user processes an issue
- **THEN** the system records the chosen action and does not overwrite the original finding details

### Requirement: Source distinction
The system SHALL distinguish AI-generated issues from manually created review issues.

#### Scenario: Mixed issue list is shown
- **WHEN** AI and manual issues are displayed together
- **THEN** the user can identify whether each issue came from AI or manual review

### Requirement: Manual issue creation contract
The system SHALL create manual review issues using the same structured issue contract as AI-generated review issues.

#### Scenario: Manual issue is created from selected text
- **WHEN** a user submits a manual annotation for selected text
- **THEN** the created issue has `source` set to `manual`, `status` set to `pending`, and an anchor with paragraph identity, offsets, and selected text

### Requirement: Manual issue default fields
The system SHALL provide sensible default values for manual issue fields when the user leaves optional fields empty.

#### Scenario: User submits partial manual annotation
- **WHEN** the user submits selected text with only a title
- **THEN** the system still creates a complete issue with fallback reason, basis, and suggestion text

### Requirement: Reversible resolution contract
The system SHALL store the current issue decision as a reversible resolution state rather than a final locked action.

#### Scenario: User switches issue decision
- **WHEN** the user changes an issue from accepted to rejected or rejected to accepted
- **THEN** the issue stores the latest decision without losing the original finding details

### Requirement: Accepted suggestion snapshot
The system SHALL snapshot the current suggestion text when an issue is accepted.

#### Scenario: User accepts edited suggestion
- **WHEN** the user edits a suggestion and clicks accept
- **THEN** the accepted issue stores the edited suggestion as the text to apply in review-revise mode

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

