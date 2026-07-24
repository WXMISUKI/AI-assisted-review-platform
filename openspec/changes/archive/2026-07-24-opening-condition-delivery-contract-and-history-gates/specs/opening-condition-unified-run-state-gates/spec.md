## ADDED Requirements

### Requirement: Historical report actions follow shared gates
The opening-condition report page SHALL use shared run-state gates and delivery handoff facts to distinguish current-run actions from historical inspection.

#### Scenario: Current run report actions are visible
- **WHEN** the selected report run is the current run and the shared gates allow report generation, archive, or rectification rerun
- **THEN** the report page may show those actions with the shared disabled reason when unavailable

#### Scenario: Historical run report actions are hidden
- **WHEN** the selected report run is not the current run
- **THEN** the report page shows full historical details but does not expose actions that mutate that historical run

#### Scenario: Archived current run starts next round explicitly
- **WHEN** the selected current run is archived
- **THEN** the report page exposes the rectification rerun entry only as a new-run creation path
- **AND** the material-intake page remains read-only until that explicit mode is entered
