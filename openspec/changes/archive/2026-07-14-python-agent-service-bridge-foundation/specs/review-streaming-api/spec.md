# review-streaming-api Delta

## ADDED Requirements

### Requirement: Run events can include safe agent source metadata
The review streaming API SHALL preserve replayable generation events while allowing safe agent execution source metadata.

#### Scenario: Agent service emits stage events
- **WHEN** delegated execution returns accepted stage events
- **THEN** the backend appends them to the existing run event history with safe source metadata and monotonic ordering

#### Scenario: Execution falls back locally
- **WHEN** agent service delegation falls back to local execution
- **THEN** replayed events and SSE completion include safe fallback source and reason fields without changing the frontend loading contract

### Requirement: Streaming contract hides bridge internals
The review streaming API SHALL not expose raw agent service transport details to browser clients.

#### Scenario: Client receives replayed events
- **WHEN** a frontend subscribes to SSE or requests stored events
- **THEN** it receives normalized run events rather than raw HTTP status, private endpoint URLs, auth headers, prompts, or provider traces
