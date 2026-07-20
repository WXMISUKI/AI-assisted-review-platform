## ADDED Requirements

### Requirement: ZIP-manifest-backed evidence matching
The system SHALL consume ZIP-derived packet inventory entries as the preferred deterministic candidate source for opening-condition material matching.

#### Scenario: Formal match uses extracted ZIP entry names
- **WHEN** a pilot packet has inventory entries extracted from a ZIP manifest
- **THEN** deterministic checklist matching evaluates checklist hints against those extracted entry names, relative paths, and summaries before using coarser packet object names

#### Scenario: Evidence preserves traceability to the original ZIP source object
- **WHEN** a checklist item matches an inventory entry extracted from a ZIP source object
- **THEN** the resulting evidence keeps safe traceability to that source object while presenting the matched ZIP entry path or file name as the operator-facing locator
