## MODIFIED Requirements

### Requirement: Opening condition review packet
The system SHALL represent an opening-condition review as a workspace-scoped review packet containing selected context, bound basis-set version, master-data readiness, submitted material status, check item outcomes, evidence summaries, human-review triggers, and report summary.

#### Scenario: Review packet is displayed
- **WHEN** a user opens an opening-condition review packet
- **THEN** the system displays the workspace context, packet stage, bound basis-set version, master-data readiness, check outcome counts, and report summary from one typed domain contract

#### Scenario: Packet lacks context
- **WHEN** a review packet has no selected workspace context
- **THEN** the system treats the packet as invalid for formal checking and requires context selection first

### Requirement: Basis confirmation before review
The opening-condition review workflow SHALL treat published basis-set confirmation as a prerequisite for formal check conclusions.

#### Scenario: Basis requires confirmation
- **WHEN** a basis document is newly recognized, conflicting, expired, or low-confidence
- **THEN** the system marks it for human review before treating related check conclusions as final auxiliary opinions

#### Scenario: Basis is confirmed
- **WHEN** a basis version has been confirmed and published by a human reviewer
- **THEN** opening-condition check items can reference that basis version id in their evidence and report summary

#### Scenario: Formal review starts
- **WHEN** a formal opening-condition review starts
- **THEN** the review packet binds to one published basis-set version

### Requirement: Project master data initialization
The opening-condition review workflow SHALL initialize project personnel, equipment, certificates, companies, and system documents as reusable master data before item-level checking, and SHALL distinguish provisional extracted records from published master data.

#### Scenario: Master data is initialized
- **WHEN** uploaded system-construction materials are parsed and confirmed
- **THEN** the system stores normalized master-data records with status, evidence file, validity, and confidence summary

#### Scenario: Check item references master data
- **WHEN** a check item needs to verify a person, equipment item, certificate, company, or document
- **THEN** the system compares it against published master data instead of relying only on ad hoc full-text LLM search

#### Scenario: Master data is not published
- **WHEN** required master data remains provisional or unconfirmed
- **THEN** related check items are marked blocked or requiring human review instead of being silently passed

### Requirement: Auxiliary report summary
The opening-condition review workflow SHALL produce an internal auxiliary report summary that is traceable to workspace context, basis-set version, check items, evidence, and human-review status.

#### Scenario: Report summary is generated
- **WHEN** opening-condition review data is available
- **THEN** the system displays total, passed, failed, warning, and human-review counts together with risk distribution and next action

#### Scenario: Report includes disclaimer
- **WHEN** the report summary is shown
- **THEN** it states that the output is an internal auxiliary opinion and final responsibility remains with the human reviewer

#### Scenario: Report references basis
- **WHEN** the report summary is generated for a formal task
- **THEN** it includes the bound basis-set version and workspace context used for the check
