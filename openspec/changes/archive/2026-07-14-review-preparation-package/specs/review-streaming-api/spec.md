# review-streaming-api Specification

## Purpose

Extend the backend review-agent stream so structure-aware review-preparation output can be normalized into a restorable package before the workbench unlocks.

## Requirements

### Requirement: Package-shaped review completion
The backend review-agent stream SHALL emit package metadata on completion when recovered-structure context is supplied.

#### Scenario: Structure-aware stream completes
- **WHEN** the client subscribes to the review-agent stream with recovered section and paragraph metadata
- **THEN** the final completion event includes package metadata containing source, status, structure summary, stage events, issue summaries, provider summary, and completion time

#### Scenario: Legacy stream completes
- **WHEN** the client subscribes without recovered-structure metadata
- **THEN** the backend continues to emit the existing connectivity-oriented completion event without requiring package consumers

### Requirement: Safe preparation package metadata
The review-agent stream SHALL only expose safe provider and preparation metadata.

#### Scenario: Provider status is included
- **WHEN** package metadata includes provider readiness
- **THEN** it does not expose API keys, object-storage credentials, raw tokens, or private document URLs

#### Scenario: Stream cannot prepare a package
- **WHEN** structure context is missing or invalid
- **THEN** the client can fall back to local review-preparation stages without treating the stream as a failed review task
