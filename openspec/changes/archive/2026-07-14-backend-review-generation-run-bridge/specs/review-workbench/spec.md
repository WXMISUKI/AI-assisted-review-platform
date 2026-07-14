# review-workbench Specification

## Purpose

Let the locked review-loading flow prefer backend generation runs while preserving current fallback behavior and workbench unlock semantics.

## Requirements

### Requirement: Loading flow prefers backend generation run bridge
The review-loading flow SHALL prefer a backend generation run bridge when it has enough recovered document context.

#### Scenario: Recovered paragraphs are available
- **WHEN** the user starts review generation for a task with recovered paragraph context
- **THEN** the loading flow can create a backend generation run and subscribe to its run-specific stream

#### Scenario: Backend run stream progresses
- **WHEN** the run-specific stream emits stage events
- **THEN** the loading view updates progress, current stage, paragraph context, and recent activity summaries using the existing locked loading presentation

### Requirement: Loading flow keeps safe fallback
The review-loading flow SHALL preserve the existing local and legacy SSE fallback path.

#### Scenario: Backend run creation fails
- **WHEN** the backend cannot create a generation run
- **THEN** the loading flow falls back to the existing review-agent stream or local preparation stages without blocking review recovery

#### Scenario: Backend run stream times out
- **WHEN** the run-specific stream times out or terminates without a usable completion payload
- **THEN** the loading flow can fall back without double-generating issues or displaying unsafe diagnostics

### Requirement: Workbench unlock remains generation-state driven
The workbench SHALL continue to unlock based on the review generation run state after backend run bridge completion.

#### Scenario: Backend run completes ready
- **WHEN** the backend run completion is mapped into a ready local generation run
- **THEN** the editable workbench can open with generated issues available

#### Scenario: Backend run completes degraded
- **WHEN** the backend run completion is mapped into a degraded local generation run with reviewable document state
- **THEN** the workbench remains openable while safe degraded context is visible

### Requirement: No unsafe diagnostics in loading or workbench
The loading view and workbench SHALL only display safe generation summaries from backend run events.

#### Scenario: Backend event includes diagnostics
- **WHEN** diagnostics are available in a run event or completion payload
- **THEN** the UI displays only safe status/message/count labels and excludes prompts, provider traces, secrets, private URLs, and unbounded document text
