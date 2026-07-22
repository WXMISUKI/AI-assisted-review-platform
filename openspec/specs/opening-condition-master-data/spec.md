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

