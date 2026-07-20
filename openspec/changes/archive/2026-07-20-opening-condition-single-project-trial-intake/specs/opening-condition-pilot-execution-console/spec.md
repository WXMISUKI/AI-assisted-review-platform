## MODIFIED Requirements

### Requirement: Explicit pilot execution actions
The system SHALL expose explicit operator actions for real-file trial bootstrap, pilot intake/init, formal matching, and state refresh in the opening-condition review portal.

#### Scenario: Operator initializes pilot intake
- **WHEN** the pilot task is not yet packet-ready or the operator wants to reinitialize the task
- **THEN** the portal allows an explicit intake/init action and displays the resulting readiness summary

#### Scenario: Operator bootstraps from real files
- **WHEN** the operator selects basis, checklist, and material ZIP files for the single-project trial
- **THEN** the portal uploads them through the existing object-storage channel and calls the domain bootstrap API with safe object refs

#### Scenario: Operator starts formal matching
- **WHEN** the pilot task has a packet-bound task context and the operator chooses to run formal matching
- **THEN** the portal triggers backend checklist matching explicitly instead of doing so automatically during workspace sync

#### Scenario: Operator refreshes execution state
- **WHEN** the operator requests refresh
- **THEN** the portal reloads current task state and readiness without mutating the task
