# review-agent-orchestration Delta

## ADDED Requirements

### Requirement: Worker completion updates review task state
The review orchestration layer SHALL attempt to materialize terminal generation output into the matching review task after worker execution succeeds.

#### Scenario: Worker completes a run
- **WHEN** a worker appends a terminal ready or degraded run event
- **THEN** it attempts to update the matching review task aggregate with safe reviewable output

#### Scenario: Matching task is absent
- **WHEN** no persisted review task exists for the completed run task id
- **THEN** materialization no-ops safely while keeping run events available for later recovery

### Requirement: Dead-lettered generation updates task failure safely
The review orchestration layer SHALL safely reflect unrecoverable generation failure in the review task when possible.

#### Scenario: Worker exhausts retries
- **WHEN** a generation job is dead-lettered and the run is marked failed
- **THEN** the matching task can store a safe failed generation snapshot without exposing internal traces
