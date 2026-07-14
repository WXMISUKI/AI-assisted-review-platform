# review-agent-orchestration Specification

## Purpose

Define task-level review generation lifecycle semantics above stage-level streaming progress.

## Requirements

### Requirement: Task-level generation lifecycle
The review orchestration layer SHALL expose a task-level generation lifecycle that summarizes preparation and issue generation.

#### Scenario: Pipeline is running
- **WHEN** review preparation or draft issue generation is in progress
- **THEN** the lifecycle reports a running generation run with the latest active stage metadata

#### Scenario: Pipeline is ready
- **WHEN** preparation package persistence and draft issue generation finish successfully
- **THEN** the lifecycle reports a ready generation run that can unlock the review workbench

#### Scenario: Pipeline is degraded
- **WHEN** provider-backed generation falls back safely or yields no generated candidates
- **THEN** the lifecycle reports a degraded generation run that can still unlock the review workbench

### Requirement: Safe run diagnostics
The review orchestration layer SHALL expose only safe run diagnostics.

#### Scenario: Provider failure is summarized
- **WHEN** the generation run records fallback or failure details
- **THEN** diagnostics contain only safe status/message/source fields and exclude secrets, prompts, raw provider traces, and private document URLs
