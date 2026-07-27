## MODIFIED Requirements

### Requirement: Current run binding snapshot
The system SHALL show which published or approved intake assets the current run is actually consuming in a visually separate snapshot, without treating workspace catalog records as current-run bindings.

#### Scenario: Operator reviews current run binding
- **WHEN** a pilot task exists for the selected workspace
- **THEN** the page shows the task-bound basis version, current-run master-data facts, and bound knowledge-base summary in a dedicated current-run snapshot
- **AND** each snapshot asset shows its lifecycle status and whether it is usable for formal matching
- **AND** the snapshot is visually separated from the broader workspace catalog

#### Scenario: Bound asset record is missing from catalog
- **WHEN** a pilot task contains a binding id but the corresponding workspace catalog record is unavailable
- **THEN** the snapshot shows the binding id and an explicit missing-record state
- **AND** the page does not substitute an unrelated catalog record

#### Scenario: Operator reviews current run binding during rerun
- **WHEN** a current run has a previous archived run in the same workspace
- **THEN** the governance page shows a reuse snapshot for the current run
- **AND** it distinguishes reused assets, newly introduced assets, assets needing reconfirmation, and assets no longer used by the current run

### Requirement: Basis preview governance queue
The opening-condition publication governance workspace SHALL distinguish basis records by preview and publication readiness instead of showing only raw status values, including the current run's bound preview state.

#### Scenario: Operator reviews basis preview queue
- **WHEN** basis records exist for the selected workspace
- **THEN** the governance page groups or labels them as needs-preview-confirmation, publish-ready, published, or exception records
- **AND** each basis record shows source file, preview fact summary, missing fields, confidence, extraction provenance, and next action

#### Scenario: Operator reviews current-run basis preview
- **WHEN** a pilot run is selected and bound to a basis record or basis version
- **THEN** the governance page highlights the run-bound basis preview separately from the workspace catalog
- **AND** it shows preview status, confidence, extraction provenance, missing fields, and next action
- **AND** the page explains that preview confirmation is not the same as publication

### Requirement: Provider provenance in publication governance
The publication governance surface SHALL show provider provenance for provider-derived basis previews before publication and SHALL keep formal-match availability gated on publication.

#### Scenario: Provider-derived preview is shown
- **WHEN** a basis preview was refreshed from provider structured output
- **THEN** the current-run snapshot shows the provider source, extractor, confidence, missing fields, and next action alongside the preview facts
- **AND** the formal-match availability label remains unavailable until the preview is human-confirmed and the basis is published

#### Scenario: Provider-derived preview is rejected
- **WHEN** an operator rejects a provider-derived preview
- **THEN** the system keeps the provider provenance and rejection note visible as an exception record for follow-up
