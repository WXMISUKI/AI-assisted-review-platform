## MODIFIED Requirements

### Requirement: Intake gate explains basis preview status
The current run intake preview gate SHALL explain whether the run-bound basis is only provisional, confirmed, or published.

#### Scenario: Current run has provisional basis preview
- **WHEN** the current run is bound to a basis record whose preview still needs human confirmation
- **THEN** the intake gate shows the preview summary, extracted candidate facts, missing facts, confirmation status, extraction provenance, and a next action to confirm/publish basis before formal matching

#### Scenario: Current run has published basis preview
- **WHEN** the current run is bound to a basis record whose confirmed preview has been published
- **THEN** the intake gate marks the basis gate as ready and keeps the published version id visible

### Requirement: Formal matching uses only published basis
The opening-condition formal matching action SHALL remain blocked until the current run has a published basis version derived from a confirmed preview or other approved basis workflow.

#### Scenario: Operator attempts matching with unconfirmed basis preview
- **WHEN** the operator runs formal checklist matching while basis preview confirmation or publication is still pending
- **THEN** the backend rejects matching with a safe preflight status and next action
