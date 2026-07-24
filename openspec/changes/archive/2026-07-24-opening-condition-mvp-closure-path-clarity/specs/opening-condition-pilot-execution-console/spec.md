## ADDED Requirements

### Requirement: MVP closure path visibility
The opening-condition portal SHALL show the current run's progress against the minimum MVP closure loop.

#### Scenario: Operator reviews current MVP progress
- **WHEN** an opening-condition pilot task is selected
- **THEN** the portal shows whether intake, formal matching, human review, report/export, archive, and rerun readiness have been reached
- **AND** the portal identifies the recommended next MVP page

#### Scenario: Operator opens a non-MVP governance page
- **WHEN** the operator opens a governance-oriented page during MVP validation
- **THEN** the portal explains that the page is not the primary MVP path and provides a route back to the recommended MVP step

### Requirement: MVP completion definition
The opening-condition MVP SHALL be considered minimally runnable when one run can be initialized, matched, reviewed, reported, exported or ready for export, archived, and followed by a new rerun.

#### Scenario: Current run is archived
- **WHEN** a pilot run is archived with a report asset
- **THEN** the MVP status shows the run as closed and points the operator to report history or next-round rerun
