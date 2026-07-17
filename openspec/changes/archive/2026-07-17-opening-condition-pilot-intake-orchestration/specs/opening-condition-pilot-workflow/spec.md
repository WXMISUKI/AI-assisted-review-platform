## ADDED Requirements

### Requirement: Formal intake/init workflow path
The system SHALL provide a formal initialization workflow path that creates or updates a pilot task before packet matching.

#### Scenario: Intake precedes formal matching
- **WHEN** a user wants to start a real opening-condition pilot from uploaded packet objects
- **THEN** the system initializes the pilot task through the intake/init path before checklist matching is allowed

#### Scenario: Packet intake is domain-orchestrated
- **WHEN** a packet is initialized through the intake/init path
- **THEN** the system records safe task events for initialization and packet acceptance without requiring the frontend to manually sequence multiple domain writes

### Requirement: Task-bound basis traceability
The system SHALL preserve safe task-bound basis traceability after intake/init.

#### Scenario: Published basis has a source object
- **WHEN** the selected basis record includes a safe source object reference or bounded evidence refs
- **THEN** the task-bound basis reference includes that traceability for later report and audit use
