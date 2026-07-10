## ADDED Requirements

### Requirement: Streaming review panels
The system SHALL provide a streaming review workbench state with outline, document, and issues panels.

#### Scenario: Streaming state starts
- **WHEN** review processing begins from the document library
- **THEN** the user sees staged AI progress alongside placeholder outline, document, and issue panels

#### Scenario: Streaming state completes
- **WHEN** the mock stream reaches completion
- **THEN** the system transitions to the normal review workbench

### Requirement: Streaming event model
The system SHALL model streaming progress as ordered events that can later map to SSE or WebSocket messages.

#### Scenario: Stage event is processed
- **WHEN** a stage event is received
- **THEN** the UI updates the current stage and progress timeline

#### Scenario: Issue event is processed
- **WHEN** an issue event is received
- **THEN** the UI appends the issue summary to the streaming issues panel
