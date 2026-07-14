# review-session-state Specification

## Purpose

Map backend generation run completion payloads into the existing local review task aggregate without duplicating run, package, issue, or activity persistence semantics in page components.

## Requirements

### Requirement: Backend run completion maps to task session state
The review session state SHALL consume backend generation run completion payloads through existing service-level operations.

#### Scenario: Backend run completes ready
- **WHEN** a run-specific stream completion contains a ready status, preparation package, and draft issue generation output
- **THEN** the frontend persists the package, merges generated issues, stores draft issue generation snapshot, marks the generation run ready, and appends safe activity events through the session service

#### Scenario: Backend run completes degraded
- **WHEN** a run-specific stream completion contains a degraded status with safe diagnostics or fallback issue output
- **THEN** the frontend keeps the task reviewable, stores safe diagnostics, and marks the generation run degraded through the session service

### Requirement: Backend run failure remains retryable
The review session state SHALL treat backend run bridge failures as retryable generation failures or fall back to the existing local flow when safe.

#### Scenario: Run stream fails before usable package
- **WHEN** the run-specific stream fails before a reviewable preparation package exists
- **THEN** the task can be marked failed with safe diagnostics and exposed through the existing retry action

#### Scenario: Run bridge is unavailable
- **WHEN** the backend run creation or stream subscription fails
- **THEN** the frontend may fall back to the existing review-agent stream and local preparation flow without corrupting the current generation run

### Requirement: Backend completion does not duplicate draft issue generation
The review session state SHALL avoid generating or merging draft issues twice for the same backend generation run.

#### Scenario: Completion already includes draft output
- **WHEN** the run-specific stream provides draft issue generation output
- **THEN** the frontend does not call the standalone draft issue endpoint for the same run

#### Scenario: Completion lacks draft output
- **WHEN** a stream completion provides only a preparation package
- **THEN** the frontend may use the existing standalone draft issue endpoint as a compatibility fallback
