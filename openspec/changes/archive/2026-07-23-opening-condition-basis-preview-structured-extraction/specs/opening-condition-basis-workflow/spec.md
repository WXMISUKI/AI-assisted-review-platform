## MODIFIED Requirements

### Requirement: Basis ingestion preview before publication
The opening-condition portal SHALL store an operator-facing structured preview for contract or qualification basis records before those records can be treated as formal published basis.

#### Scenario: Basis upload creates a structured preview
- **WHEN** a contract or qualification basis object is registered for a workspace
- **THEN** the system records source file evidence, preview facts, confidence, missing fields, preview status, extraction provenance, and safe operator notes without storing raw provider traces or private URLs

#### Scenario: Preview requires human confirmation
- **WHEN** a basis record has preview facts but has not been confirmed by an operator
- **THEN** the system keeps the record out of formal matching readiness and marks the next action as human confirmation

#### Scenario: Human confirms preview facts
- **WHEN** an operator confirms or corrects the basis preview
- **THEN** the system records confirmation status, reviewer placeholder, timestamp, safe note, and the confirmed preview facts for later publication

### Requirement: Basis preview publication audit
The opening-condition basis workflow SHALL keep a safe audit trail from preview to publication.

#### Scenario: Confirmed preview is published
- **WHEN** a confirmed basis preview is published
- **THEN** the published basis version keeps the preview summary, source evidence, publisher placeholder, publication time, and supersedes previous published basis in the same workspace

#### Scenario: Unconfirmed preview cannot be published
- **WHEN** a basis record still requires human confirmation or has unresolved missing required facts
- **THEN** publication is blocked with an operator-facing status and next action
