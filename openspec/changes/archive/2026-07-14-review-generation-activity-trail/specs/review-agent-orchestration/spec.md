# review-agent-orchestration Specification

## Purpose

Define safe lifecycle activity events above the latest review generation run snapshot.

## Requirements

### Requirement: Generation lifecycle activity events
The review orchestration layer SHALL produce safe activity events for meaningful generation lifecycle transitions.

#### Scenario: Run starts or retries
- **WHEN** a generation run starts for the first time or after a terminal run
- **THEN** the orchestration state can record `run-started` and, when applicable, `run-retried`

#### Scenario: Stage advances
- **WHEN** the active generation stage meaningfully changes
- **THEN** the orchestration state can record a `stage-updated` activity with safe stage metadata

#### Scenario: Terminal state is reached
- **WHEN** generation becomes ready, degraded, or failed
- **THEN** the orchestration state records a terminal activity that references the current run id and safe terminal status

### Requirement: Activity events are backend-replaceable
The generation activity event contract SHALL remain compatible with future backend worker events.

#### Scenario: Backend worker event arrives
- **WHEN** a future worker emits a lifecycle event with task id, run id, event type, and safe payload
- **THEN** it can be mapped to the same activity trail contract used by the local session service
