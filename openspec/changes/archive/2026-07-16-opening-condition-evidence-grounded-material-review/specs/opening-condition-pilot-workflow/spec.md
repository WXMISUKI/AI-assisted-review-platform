## ADDED Requirements

### Requirement: Contract-scoped master-data matching
The system SHALL enforce contract-scoped master-data matching for personnel and equipment checklist items in the opening-condition pilot workflow.

#### Scenario: Personnel or equipment item has only uploaded material
- **WHEN** a personnel or equipment checklist item matches an uploaded file but has no published or human-approved project master-data support
- **THEN** the system does not automatically pass the item and creates a human-review reason for missing master-data authorization

#### Scenario: Personnel or equipment item has authorized master data
- **WHEN** a personnel or equipment checklist item matches uploaded evidence and all required master-data references are published or human-approved within the selected workspace
- **THEN** the system records the item as authorized by project master data under the published basis boundary

### Requirement: Material-only pilot scope
The system SHALL distinguish material-review checklist items from unsupported on-site, emergency-response, or field-observation checklist items during the pilot.

#### Scenario: Unsupported field item appears in checklist input
- **WHEN** a checklist item is identified as outside the current material-review scope
- **THEN** the system marks the item as not applicable or out of scope and excludes it from missing-material failure counts

### Requirement: Visual assertion review gate
The system SHALL create human-review gates for required low-confidence visual assertions during opening-condition pilot matching.

#### Scenario: Signature or stamp is required and uncertain
- **WHEN** an item hint or extracted summary indicates that signature, stamp, checkbox, seal, or handwritten date evidence is required and the submitted packet lacks stable evidence for it
- **THEN** the system records a visual assertion gap and opens a human-review item before report generation
