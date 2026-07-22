# opening-condition-rerun-asset-reuse Specification

## Purpose
Define how a rectification rerun reuses previously confirmed basis and master-data assets while clearly surfacing current-run changes that still require operator attention.

## Requirements
### Requirement: Adjacent-run asset reuse snapshot
The system SHALL derive an operator-facing asset reuse snapshot for the current opening-condition run by comparing it with the previous archived run in the same workspace.

#### Scenario: Current run inherits previously confirmed assets
- **WHEN** the current run and a previous archived run both exist in the same workspace
- **THEN** the portal shows which basis and master-data assets are still reused from the previous archived run
- **AND** it distinguishes those reused assets from assets first introduced in the current run

### Requirement: Reconfirmation-focused asset diff
The system SHALL group current-run assets by whether they can continue as reused facts or still require fresh operator confirmation.

#### Scenario: Current run still contains pending publication or confirmation
- **WHEN** the current run binds a basis or master-data record whose status is not yet formally usable
- **THEN** the portal marks that asset as needing reconfirmation
- **AND** it does not describe that asset as fully reused even if a similar asset existed in the previous archived run

### Requirement: Dropped asset visibility
The system SHALL preserve visibility of assets that were used in the previous archived run but are no longer bound to the current run.

#### Scenario: Previous run asset is no longer in current run
- **WHEN** a basis or master-data asset was bound to the previous archived run but is absent from the current run
- **THEN** the portal lists it as no longer used by the current run
- **AND** it keeps the previous run itself read-only
