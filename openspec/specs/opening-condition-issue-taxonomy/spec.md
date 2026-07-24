# opening-condition-issue-taxonomy Specification

## Purpose
Define a platform-owned issue taxonomy for opening-condition pilot findings so report delivery, rectification handoff, and future intelligent assets rely on stable structured facts instead of free-form report text alone.

## Requirements
### Requirement: Opening-condition issue taxonomy registry
The system SHALL define a platform-owned issue taxonomy for opening-condition review findings instead of relying on free-form report text only.

#### Scenario: Pilot finding is materialized
- **WHEN** a checklist item becomes failed, blocked, warning, or needs-human-review during opening-condition matching
- **THEN** the system assigns or derives a stable issue taxonomy identity for that finding
- **AND** the finding can expose an issue type id, display label, and operator-facing classification

### Requirement: Structured legal-basis and rectification fields
The opening-condition issue taxonomy SHALL provide structured legal-basis and rectification semantics for reportable findings.

#### Scenario: Finding requires supervisor action
- **WHEN** a finding is included in the opening-condition report handoff
- **THEN** the finding contains risk level, legal basis references, rectification requirement, and follow-up verification guidance when available

### Requirement: Taxonomy-derived fallback mapping
The system SHALL support deterministic fallback mapping from current pilot checklist findings to issue taxonomy records.

#### Scenario: Existing pilot task has no explicit issue fields
- **WHEN** a historical or current pilot task is rendered after this capability is introduced
- **THEN** the system can derive issue taxonomy fields from checklist name, category, disposition, and human-review outcome without breaking compatibility

### Requirement: Future intelligent-asset hooks
The issue taxonomy SHALL preserve extension hooks for reusable intelligent assets without requiring those assets to be implemented in the same change.

#### Scenario: Taxonomy record is inspected
- **WHEN** a platform component reads an opening-condition issue taxonomy record
- **THEN** the record can optionally reference reusable agent, prompt, template, or knowledge asset identifiers for future orchestration
