## MODIFIED Requirements

### Requirement: Run-level action ownership
The system SHALL derive one operator-facing action ownership summary for the current opening-condition pilot run.

#### Scenario: Run is waiting for preflight completion
- **WHEN** the current run is blocked on basis, master data, knowledge base, or intake gate confirmation
- **THEN** the system shows the current owner as the operator role responsible for completing preflight confirmation
- **AND** the next action states which gate must be completed before formal matching

#### Scenario: Run is awaiting human review
- **WHEN** the current run has open or deferred human-review items
- **THEN** the system shows the current owner as the supervising review role
- **AND** the next action states that human-review blockers must be closed before report generation

#### Scenario: Run is report ready
- **WHEN** the current run has no blocking human-review items and is in `report_ready`
- **THEN** the system shows the current owner as the operator responsible for report delivery
- **AND** the next action states that report generation or archive is the current delivery step

#### Scenario: Run is archived
- **WHEN** the selected run is archived
- **THEN** the system marks the run as read-only with no active owner for mutation
- **AND** the next action shifts to starting a new rectification rerun from the report page when more materials must be submitted
- **AND** action ownership does not advertise direct mutation of the archived run
