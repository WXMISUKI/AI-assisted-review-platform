# review-session-state Delta

## ADDED Requirements

### Requirement: Backend run completion materializes task aggregate
The review session state SHALL allow backend completed generation runs to update the persisted review task aggregate without requiring a live browser SSE consumer.

#### Scenario: Backend run completes with draft issues
- **WHEN** a backend generation run reaches a ready or degraded terminal completion with a preparation package and draft issue generation payload
- **THEN** the matching review task stores the package, generated issues, draft issue snapshot, terminal run snapshot, and safe activity events

#### Scenario: User reopens after browser disconnect
- **WHEN** the user later opens a task whose backend run already materialized
- **THEN** the session state can load the persisted task with generated issues already present

### Requirement: Backend materialization is idempotent
The review session state SHALL not duplicate issues, draft snapshots, or activity events when the same run completion is applied more than once.

#### Scenario: Completion is applied twice
- **WHEN** backend materialization and frontend SSE completion both process the same draft issue generation run id
- **THEN** the task keeps one draft snapshot and one set of generated issue candidates
