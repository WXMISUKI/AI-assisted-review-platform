## ADDED Requirements

### Requirement: Basis-backed issue presentation
The review workbench SHALL expose the main review basis for each AI issue.

#### Scenario: User opens an AI issue card
- **WHEN** the issue has structured basis references
- **THEN** the card shows the primary clause or project document reference, check domain, engine source, and判定标准 without requiring the user to read raw JSON

### Requirement: Traceability detail disclosure
The review workbench SHALL allow users to inspect detailed traceability for a finding.

#### Scenario: User expands issue details
- **WHEN** the issue has multiple normative or project references
- **THEN** the workbench displays source title, version or document locator, clause number where available, summary, and priority

### Requirement: Scenario output distinction
The review workbench SHALL distinguish construction-unit self-check, supervisor formal review, and expert-review assistance findings.

#### Scenario: User scans the issue list
- **WHEN** issues from different output scenarios are shown
- **THEN** each issue indicates its scenario so the user can understand whether it supports整改自查, formal supervisor opinion, or expert论证 assistance

### Requirement: Closed-loop rectification display
The review workbench SHALL display整改闭环 fields when available.

#### Scenario: Supervisor issue includes rectification fields
- **WHEN** an issue includes整改要求,核验标准,整改时限, or复核流程
- **THEN** the issue card exposes those fields in a readable section
