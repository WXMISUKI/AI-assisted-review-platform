## ADDED Requirements

### Requirement: Backend event compatibility
The review session state SHALL reserve a backend event contract compatible with future replacement of mock streaming updates.

#### Scenario: Backend review event is received
- **WHEN** a backend event contains stage id, title, detail, progress, and issue summaries
- **THEN** it can be mapped to the existing review session streaming state without changing page-level UI contracts
