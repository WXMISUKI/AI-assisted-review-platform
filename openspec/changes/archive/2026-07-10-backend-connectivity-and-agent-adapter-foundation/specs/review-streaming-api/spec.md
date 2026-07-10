## ADDED Requirements

### Requirement: Server-sent review events
The backend SHALL provide a server-sent events endpoint for review-agent connectivity testing.

#### Scenario: Client subscribes
- **WHEN** a client connects to the streaming endpoint
- **THEN** the backend sends text/event-stream headers and emits JSON review events

#### Scenario: Stream completes
- **WHEN** the backend finishes the deterministic connectivity stream
- **THEN** it sends a completion event and closes the connection
