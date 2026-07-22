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

### Requirement: Exception records stay visible
The system SHALL preserve visibility of rejected, superseded, or expired publication records without mixing them into the primary publish-ready queue.

#### Scenario: Operator reviews non-active records
- **WHEN** basis or master-data records have been rejected, superseded, or expired
- **THEN** the page shows them in an exception section with their status and safe reason
- **AND** they do not appear as publish-ready records

