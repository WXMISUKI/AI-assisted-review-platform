# opening-condition-publication-governance Specification

## Purpose
TBD - created by archiving change opening-condition-intake-publication-governance. Update Purpose after archive.
## Requirements
### Requirement: Publication governance workspace
The system SHALL present basis and master-data publication as an operator-facing governance workspace rather than as a flat debugging record list.

#### Scenario: Operator opens basis and master-data page
- **WHEN** the operator opens the opening-condition basis-and-master-data page for a workspace
- **THEN** the page shows publication governance sections for gate summary, current-run binding snapshot, pending publication queues, published records, and exception records

### Requirement: Current run binding snapshot
The system SHALL show which published or approved intake assets the current run is actually consuming.

#### Scenario: Operator reviews current run binding
- **WHEN** a pilot task exists for the selected workspace
- **THEN** the page shows the bound basis version, current-run master-data facts, and bound knowledge-base summary for that run
- **AND** the snapshot is visually separated from the broader workspace catalog

#### Scenario: Operator reviews current run binding during rerun
- **WHEN** a current run has a previous archived run in the same workspace
- **THEN** the governance page shows a reuse snapshot for the current run
- **AND** it distinguishes reused assets, newly introduced assets, assets needing reconfirmation, and assets no longer used by the current run

### Requirement: Exception records stay visible
The system SHALL preserve visibility of rejected, superseded, or expired publication records without mixing them into the primary publish-ready queue.

#### Scenario: Operator reviews non-active records
- **WHEN** basis or master-data records have been rejected, superseded, or expired
- **THEN** the page shows them in an exception section with their status and safe reason
- **AND** they do not appear as publish-ready records

### Requirement: Intake preview and governance continuity
The system SHALL keep the semantics of intake candidate preview and publication governance aligned.

#### Scenario: Operator moves from intake preview to publication governance
- **WHEN** the operator reviews candidate preview on the material-intake page and later opens the basis-and-master-data governance page
- **THEN** the status language and grouping used in both pages remain consistent
- **AND** the operator can understand that the governance page is the catalog view of records first introduced by the intake preview

#### Scenario: Operator compares intake and governance pages for the same rerun
- **WHEN** the operator moves between the intake preview page and the governance page for the same current run
- **THEN** both pages use the same asset reuse and difference semantics
- **AND** the operator does not need to reinterpret a record's meaning between the two pages

### Requirement: Basis preview governance queue
The opening-condition publication governance workspace SHALL distinguish basis records by preview and publication readiness instead of showing only raw status values.

#### Scenario: Operator reviews basis preview queue
- **WHEN** basis records exist for the selected workspace
- **THEN** the governance page groups or labels them as needs-preview-confirmation, publish-ready, published, or exception records
- **AND** each basis record shows source file, preview fact summary, missing fields, confidence, extraction provenance, and next action

#### Scenario: Operator reviews current-run basis preview
- **WHEN** a pilot run is selected and bound to a basis record or basis version
- **THEN** the governance page highlights the run-bound basis preview separately from the workspace catalog
- **AND** it explains whether the current run can proceed to formal matching

### Requirement: Basis preview safe display
The publication governance workspace SHALL display only safe preview facts and bounded summaries.

#### Scenario: Unsafe provider data is present in an incoming basis payload
- **WHEN** the backend stores the basis preview
- **THEN** private URLs, tokens, raw OCR text, raw prompts, provider traces, and credentials are removed from stored and returned preview data

### Requirement: Provider provenance in publication governance
The publication governance surface SHALL show provider provenance for provider-derived basis previews before publication.

#### Scenario: Provider-derived preview is shown
- **WHEN** a basis preview was refreshed from provider structured output
- **THEN** the governance surface shows the provider source, extractor, confidence, missing fields, and next action alongside the preview facts
- **AND** the publish action remains unavailable until the preview is human-confirmed

#### Scenario: Provider-derived preview is rejected
- **WHEN** an operator rejects a provider-derived preview
- **THEN** the system keeps the provider provenance and rejection note visible as an exception record for follow-up
