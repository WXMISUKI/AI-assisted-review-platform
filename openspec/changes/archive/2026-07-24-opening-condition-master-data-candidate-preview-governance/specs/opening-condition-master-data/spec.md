## ADDED Requirements

### Requirement: Master-data candidate preview contract
The opening-condition portal SHALL expose bounded candidate preview fields for master-data records before they are treated as reusable published facts.

#### Scenario: Candidate record is displayed
- **WHEN** a workspace contains provisional, confirmed, human-approved, published, or rejected master-data records
- **THEN** each record can expose source evidence, candidate facts, missing fields, confidence, preview status, safe notes, and next action without exposing raw provider traces, prompts, raw OCR text, private URLs, or credentials

#### Scenario: Trial placeholder is shown
- **WHEN** a current-run master-data record was created by trial bootstrap or another non-extraction source
- **THEN** the portal labels the source and next action clearly instead of implying that the fact was fully extracted from the uploaded packet

### Requirement: Master-data lifecycle labels
The opening-condition portal SHALL distinguish current-run confirmation from reusable workspace publication.

#### Scenario: Current-run record is human approved
- **WHEN** a master-data record has status `human_approved`
- **THEN** the operator-facing label explains that the record is confirmed for the current run or pilot gate
- **AND** the workspace catalog does not present it as a reusable published fact

#### Scenario: Record is published
- **WHEN** a confirmed master-data record is published
- **THEN** the operator-facing label explains that the record is reusable by future runs in the same workspace

### Requirement: Master-data preview decisions
The opening-condition portal SHALL support bounded operator decisions for master-data candidates.

#### Scenario: Operator confirms a candidate
- **WHEN** the operator approves a provisional master-data candidate with an optional safe note
- **THEN** the system records the confirmation state, reviewer placeholder, confirmation time, safe note, and candidate preview summary

#### Scenario: Operator rejects a candidate
- **WHEN** the operator rejects a master-data candidate with an optional safe note
- **THEN** the system excludes the record from usable master data and preserves the safe rejection reason

#### Scenario: Operator publishes a confirmed candidate
- **WHEN** the operator publishes a confirmed master-data record
- **THEN** the record becomes a reusable workspace catalog fact while preserving prior confirmation and source evidence

### Requirement: Current-run master-data binding explanation
The opening-condition portal SHALL explain which master-data records the current run can use for formal checks.

#### Scenario: Current run has usable records
- **WHEN** the current run has `human_approved` or `published` master-data records in scope
- **THEN** the page shows them as the current-run usable snapshot with source, lifecycle label, and evidence summary

#### Scenario: Current run has unresolved candidates
- **WHEN** the current run has provisional, low-confidence, rejected, expired, or missing required master-data records
- **THEN** the page shows the unresolved reason and next action before formal checklist matching
