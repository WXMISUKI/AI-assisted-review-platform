# opening-condition-evidence-grounded-material-review Specification

## Purpose
Define evidence-grounded opening-condition material review behavior for a real single-project pilot, including layered outcomes, contract-bounded resource authorization, visual assertion review, and auxiliary report wording.

## Requirements
### Requirement: Evidence-grounded material review layers
The system SHALL represent each in-scope opening-condition material checklist item with layered review outcomes for scope, document presence, relevance, content compliance, visual assertions, and final disposition.

#### Scenario: In-scope material item is evaluated
- **WHEN** a material checklist item is evaluated from a submitted packet
- **THEN** the system records `scopeStatus`, `documentPresence`, `relevanceStatus`, `contentCompliance`, `visualAssertions`, and `finalDisposition` alongside the existing verdict fields

#### Scenario: Out-of-scope checklist item is encountered
- **WHEN** a checklist item belongs to on-site inspection, emergency response, or another unsupported non-material review scope
- **THEN** the system marks it as `out_of_scope` or `not_applicable` instead of counting it as missing material

### Requirement: Contract-bounded personnel and equipment authorization
The system SHALL use published basis records to establish organization and work-scope boundaries, and SHALL require personnel and equipment checklist items to bind to published or human-approved project master data before automatic pass.

#### Scenario: Personnel item has authorized master data
- **WHEN** a personnel checklist item has matching evidence and all required personnel master-data references are published or human-approved in the selected workspace
- **THEN** the system may mark the item as matched and compliant without blocking human review

#### Scenario: Equipment item lacks authorized master data
- **WHEN** an equipment checklist item has matching uploaded material but required equipment master data is missing, provisional, rejected, or expired
- **THEN** the system marks the item as needing human review or blocked and records the missing authorization reason

#### Scenario: Contract does not enumerate every resource
- **WHEN** a contract basis confirms participating organization and work scope but does not list every worker or device
- **THEN** the system still allows personnel and equipment to pass through published or human-approved project master data under that contract boundary

### Requirement: Visual assertion human review
The system SHALL treat signature, stamp, checkbox, handwritten date, and unclear visual fields as evidence assertions with confidence and locator summaries, and SHALL send low-confidence or required visual assertions to human review.

#### Scenario: Required visual assertion is uncertain
- **WHEN** a checklist item requires a stamp, signature, checkbox, or date and the assertion is low confidence, missing, or unclear
- **THEN** the system creates a human-review item with the assertion type, safe locator summary, evidence references, and review reason

#### Scenario: Visual assertion is confirmed
- **WHEN** a reviewer confirms a visual assertion
- **THEN** the system records the reviewer decision and preserves wording that confirms review presence without claiming legal authenticity of the physical mark

### Requirement: Report uses evidence-grounded wording
The system SHALL produce auxiliary report summaries that distinguish automatic matches, missing materials, authorization gaps, visual assertions requiring review, and reviewer-confirmed items.

#### Scenario: Report summarizes unresolved material issues
- **WHEN** unresolved authorization gaps or visual assertions remain
- **THEN** the report summary identifies those issues as human-review or rectification items rather than final automatic failures where reviewer judgment is required

### Requirement: Knowledge-supported evidence grounding
The system SHALL use published preflight facts and bound subcontract-team knowledge-base references to support evidence-grounded material review.

#### Scenario: Material item references preflight facts
- **WHEN** a material review item depends on personnel, equipment, certificate, company, or system-document facts
- **THEN** the system evaluates it against published or human-approved preflight master data before using package-only semantic evidence

#### Scenario: Knowledge base provides supporting recall
- **WHEN** a bound subcontract-team knowledge base contains relevant templates, evidence summaries, or prior human corrections
- **THEN** the system may use those records to improve document matching, field normalization, and human-review explanations

#### Scenario: Knowledge base conflicts with current basis
- **WHEN** knowledge-base recall conflicts with the current published basis version or current project master data
- **THEN** the system preserves the conflict and uses current published platform facts as authoritative for formal conclusions
