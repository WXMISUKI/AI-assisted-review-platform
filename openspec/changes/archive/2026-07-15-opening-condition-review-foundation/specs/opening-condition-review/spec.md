## ADDED Requirements

### Requirement: Opening condition review packet
The system SHALL represent an opening-condition review as a review packet containing basis status, project master-data status, submitted material status, check item outcomes, evidence summaries, human-review triggers, and report summary.

#### Scenario: Review packet is displayed
- **WHEN** a user opens the opening-condition review page
- **THEN** the system displays the packet stage, basis confirmation status, master-data readiness, check outcome counts, and report summary from one typed domain contract

### Requirement: Basis confirmation before review
The opening-condition review workflow SHALL treat basis confirmation as a prerequisite for reliable check conclusions.

#### Scenario: Basis requires confirmation
- **WHEN** a basis document is newly recognized, conflicting, expired, or low-confidence
- **THEN** the system marks it for human review before treating related check conclusions as final auxiliary opinions

#### Scenario: Basis is confirmed
- **WHEN** a basis version has been confirmed by a human reviewer
- **THEN** opening-condition check items can reference that basis version id in their evidence and report summary

### Requirement: Project master data initialization
The opening-condition review workflow SHALL initialize project personnel, equipment, certificates, companies, and system documents as reusable master data before item-level checking.

#### Scenario: Master data is initialized
- **WHEN** uploaded system-construction materials are parsed and confirmed
- **THEN** the system stores normalized master-data records with status, evidence file, validity, and confidence summary

#### Scenario: Check item references master data
- **WHEN** a check item needs to verify a person, equipment item, certificate, company, or document
- **THEN** the system compares it against initialized master data instead of relying only on ad hoc full-text LLM search

### Requirement: Rule and semantic outcome separation
The opening-condition review workflow SHALL separate deterministic rule outcomes from semantic AI assistance.

#### Scenario: Deterministic rule runs
- **WHEN** a check item depends on file existence, certificate validity, master-data matching, or required-field completeness
- **THEN** the system records a rule verdict with matched evidence and a non-secret explanation

#### Scenario: Semantic assistance runs
- **WHEN** a check item depends on construction scope coverage, material relevance, or ambiguous document meaning
- **THEN** the system records a semantic note without replacing deterministic rule verdict fields

### Requirement: Evidence and human review triggers
The opening-condition review workflow SHALL preserve evidence and identify items that need Dify Human Input or equivalent human review.

#### Scenario: Evidence is attached
- **WHEN** a check item is evaluated
- **THEN** the system records source file names, page or locator summaries, extracted values, confidence labels, and matched master-data ids where available

#### Scenario: Human review is triggered
- **WHEN** OCR confidence is low, stamp/signature recognition is uncertain, basis applicability is unclear, or AI and rule outcomes conflict
- **THEN** the system marks the check item or basis/master-data record as requiring human review with a reason

### Requirement: Auxiliary report summary
The opening-condition review workflow SHALL produce an internal auxiliary report summary that is traceable to check items and human-review status.

#### Scenario: Report summary is generated
- **WHEN** opening-condition review data is available
- **THEN** the system displays total, passed, failed, warning, and human-review counts together with risk distribution and next action

#### Scenario: Report includes disclaimer
- **WHEN** the report summary is shown
- **THEN** it states that the output is an internal auxiliary opinion and final responsibility remains with the human reviewer
