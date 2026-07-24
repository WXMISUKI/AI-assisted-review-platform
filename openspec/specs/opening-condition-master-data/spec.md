# opening-condition-master-data Specification

## Purpose
TBD - created by archiving change separate-product-portals-and-opening-basis-workflow. Update Purpose after archive.
## Requirements
### Requirement: Provisional master-data extraction
The opening-condition portal SHALL extract personnel, equipment, certificates, company records, and system documents as provisional master-data records before publication.

#### Scenario: Material is parsed
- **WHEN** OCR or AI parses uploaded foundational materials
- **THEN** the system creates provisional master-data records with extracted fields, source files, confidence labels, and evidence summaries

#### Scenario: Duplicate candidate appears
- **WHEN** extraction produces records that appear to describe the same person, equipment item, certificate, company, or document
- **THEN** the system marks them for merge or human review rather than publishing duplicates automatically

### Requirement: Human master-data confirmation
Master-data records SHALL require human confirmation before they become published records used by formal checks.

#### Scenario: Reviewer confirms record
- **WHEN** a reviewer confirms or corrects a provisional master-data record
- **THEN** the system records confirmed fields, reviewer identity placeholder, confirmation time, evidence, and optional quality score

#### Scenario: Reviewer rejects record
- **WHEN** a reviewer rejects a provisional master-data record
- **THEN** the system excludes that record from published master data and preserves a safe rejection reason

### Requirement: Published master-data catalog
The opening-condition portal SHALL maintain a published master-data catalog scoped to the selected workspace.

#### Scenario: Record is published
- **WHEN** a confirmed master-data record is published
- **THEN** it becomes available to opening-condition check items in the same workspace

#### Scenario: User opens catalog
- **WHEN** a user opens the master-data page
- **THEN** the system displays published and provisional records separately

### Requirement: Validity and evidence tracking
Published master-data records SHALL preserve validity status and evidence references.

#### Scenario: Certificate validity is confirmed
- **WHEN** a certificate record is published
- **THEN** the system records its validity dates, status, source file, and evidence locator where available

#### Scenario: Check item uses master data
- **WHEN** a check item relies on a published master-data record
- **THEN** the check item references the master-data id and evidence summary

### Requirement: Master data revision lifecycle
The system SHALL create a new revision when published master data is corrected after publication.

#### Scenario: Published record is edited
- **WHEN** a user corrects a published master-data record
- **THEN** the system creates a revised record version and preserves the prior version for tasks that already referenced it

### Requirement: Pilot master-data persistence gate
The opening-condition pilot workflow SHALL persist reusable master-data records and use only published or explicitly human-approved records for formal item-level checks.

#### Scenario: Master data is published for pilot use
- **WHEN** personnel, equipment, certificate, company, or system-document records are confirmed for the pilot workspace
- **THEN** the system stores the published record id, type, normalized fields, validity summary, evidence references, reviewer identity placeholder, and publication time

#### Scenario: Formal check references master data
- **WHEN** a checklist item depends on project personnel, equipment, certificates, company records, or system documents
- **THEN** the system evaluates the item against published master-data records and records the referenced ids in evidence

#### Scenario: Required master data is provisional
- **WHEN** required master data remains provisional, duplicated, rejected, expired, or low-confidence
- **THEN** the related checklist item is blocked or marked for human review rather than passed automatically

### Requirement: Master-data publication queue visibility
The opening-condition portal SHALL distinguish provisional, human-approved, published, and exception master-data records in the operator-facing governance view.

#### Scenario: Operator reviews master-data readiness
- **WHEN** master-data records exist for the selected workspace
- **THEN** the portal groups them into pending confirmation, ready for publication, published, and exception sections
- **AND** each section explains whether the records are already usable by formal checks

### Requirement: Current run master-data snapshot visibility
The opening-condition portal SHALL show which backend facts the current run is currently using.

#### Scenario: Operator verifies current-run master-data facts
- **WHEN** the basis-and-master-data page opens for a selected pilot run
- **THEN** the page shows the current-run master-data facts separately from the full workspace catalog
- **AND** each fact includes type, confirmation state, and safe evidence note where available

### Requirement: Itemized master-data intake decisions
The opening-condition portal SHALL allow current-run master-data candidates to be individually approved or rejected from the intake preview workspace.

#### Scenario: Operator rejects one candidate and keeps others
- **WHEN** the current run includes multiple master-data candidates
- **THEN** the operator can reject one candidate while leaving the others available for approval
- **AND** the intake page refreshes the run state after the decision

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
