## ADDED Requirements

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
