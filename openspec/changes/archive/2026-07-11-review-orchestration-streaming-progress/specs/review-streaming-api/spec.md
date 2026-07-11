## ADDED Requirements

### Requirement: Enriched review progress events
The backend SHALL expose review progress events that can identify the current stage, current paragraph or section, and active agent role.

#### Scenario: Client subscribes to review progress
- **WHEN** a client connects to the review streaming endpoint
- **THEN** the backend can emit JSON events that include stage id, stage title, stage progress, current paragraph metadata, and issue summaries

#### Scenario: Review progress reaches a ready state
- **WHEN** the pipeline completes
- **THEN** the backend emits a completion event and closes the connection

### Requirement: Stream contract remains backward compatible
The review stream SHALL continue to support simple progress consumers while adding richer stage metadata.

#### Scenario: A legacy consumer reads the stream
- **WHEN** a consumer only understands basic progress and issue summaries
- **THEN** the enriched stream still conveys usable progress without requiring bidirectional transport
