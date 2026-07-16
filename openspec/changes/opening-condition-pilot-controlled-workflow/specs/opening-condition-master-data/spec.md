## ADDED Requirements

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
